import { useEffect } from 'react';

/**
 * Rolagem suave com inércia (lerp) — o "smooth scroll" de verdade:
 *  - intercepta a roda do mouse e as teclas de página;
 *  - acumula cada tique da roda num alvo e persegue esse alvo com um
 *    filtro exponencial (rápido no início, lento no fim) — sem travar
 *    no meio do caminho quando o usuário rola várias vezes seguidas;
 *  - mantém a rolagem nativa para toque, teclado e barra de rolagem;
 *  - nunca quebra âncoras, link direto com hash ou foco em formulário;
 *  - respeita prefers-reduced-motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(pointer: fine)');
    if (reduce.matches || !fine.matches) return;

    // curva de velocidade adaptativa: perto do alvo desacelera (cauda longa),
    // longe do alvo acelera — assim um giro grande não vira "teletransporte"
    const easeFor = (dist: number) => {
      if (dist > 1200) return 0.3;
      if (dist > 400) return 0.24;
      if (dist > 120) return 0.19;
      return 0.13;
    };
    const STOP = 0.5; // px: abaixo disso encostamos no alvo e paramos

    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let running = false;
    let dragging = false;
    let lastWheelAt = 0;
    let lastTs = 0;

    const maxScroll = () => {
      const d = document.documentElement;
      return (d.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    };
    const clamp = (v: number) => Math.max(0, Math.min(maxScroll(), v));

    const loop = (ts?: number) => {
      // rede de segurança: o quadro pode não ser entregue (aba em segundo
      // plano, throttle do navegador). Nesse caso avançamos por tempo real,
      // nunca "meio caminho parado" e depois um salto.
      if (ts !== undefined && lastTs) {
        const dt = Math.min(64, ts - lastTs);
        if (dt > 34) {
          const factor = 1 - Math.pow(1 - easeFor(Math.abs(target - current)), dt / 16.67);
          current += (target - current) * factor;
          if (Math.abs(target - current) < STOP) current = target;
          window.scrollTo(0, current);
          lastTs = ts;
          if (current !== target) raf = requestAnimationFrame(loop);
          else running = false;
          return;
        }
      }
      if (ts !== undefined) lastTs = ts;
      const delta = target - current;
      if (Math.abs(delta) < STOP) {
        current = target;
        window.scrollTo(0, current);
        running = false;
        raf = 0;
        return;
      }
      // ease-out: a distância encolhe proporcionalmente a cada quadro
      current += delta * easeFor(Math.abs(delta));
      window.scrollTo(0, current);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    // durante o arrasto (grab) o navegador rola sozinho: não brigamos com ele
    const onDragState = (e: Event) => {
      dragging = (e as CustomEvent<boolean>).detail;
      if (dragging) {
        target = current = window.scrollY;
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    window.addEventListener('cx:drag', onDragState as EventListener);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented || dragging) return;
      const el = e.target as HTMLElement | null;
      // deixa o usuário rolar dentro de painéis com rolagem própria
      if (el && el.closest('[data-native-scroll], textarea, select')) return;
      // rolagem horizontal de trackpad não vira vertical
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.6) return;

      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 18;
      else if (e.deltaMode === 2) d *= window.innerHeight;

      // se o usuário parou de rolar, reancoramos para evitar "deriva".
      // Enquanto o loop está rodando, current é a posição que nós mesmos
      // escrevemos — reler window.scrollY aqui cortaria o movimento pela metade.
      const now = performance.now();
      if (now - lastWheelAt > 220) {
        target = window.scrollY;
        current = window.scrollY;
      }
      lastWheelAt = now;

      target = clamp(target + d);
      start();
    };

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const vh = window.innerHeight;
      let next: number | null = null;
      if (e.key === 'PageDown') next = target + vh * 0.9;
      else if (e.key === 'PageUp') next = target - vh * 0.9;
      else if (e.key === ' ' && !e.shiftKey) next = target + vh * 0.85;
      else if (e.key === ' ' && e.shiftKey) next = target - vh * 0.85;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = maxScroll();
      if (next === null) return;
      e.preventDefault();
      target = clamp(next);
      start();
    };

    // rolagem nativa (barra, âncora, teclado do sistema): ressincroniza
    const sync = () => {
      if (!running) {
        target = window.scrollY;
        current = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('cx:drag', onDragState as EventListener);
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
