import { useEffect, useRef, useState } from 'react';

type Props = { children: React.ReactNode };

/**
 * Carrossel horizontal infinito com arrasto (grab-and-drag).
 * - Arrasta com o mouse, roda o dedo no celular ou usa a roda do trackpad.
 * - Loop infinito real: clona o conjunto de slides dos dois lados.
 * - Snap suave com inércia, setas de teclado e botões.
 */
export function DragCarousel({ children }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const kids = Array.isArray(children) ? children : [children];

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let offset = 0;
    let setWidth = 0;
    let step = 0;
    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    let velocity = 0;
    let lastX = 0;
    let lastT = 0;
    let raf = 0;
    let snapping = false;
    let alive = true;
    let idle = 0;

    const wrap = () => {
      if (setWidth <= 0) return;
      if (offset <= -setWidth * 2) offset += setWidth;
      if (offset > -setWidth * 0.2) offset -= setWidth;
    };

    const center = () => {
      const vw = viewport.clientWidth;
      const gutter = parseFloat(getComputedStyle(viewport).paddingLeft || '0') || 0;
      return offset + vw / 2 - gutter;
    };

    const markActive = () => {
      const c = center();
      const slides = track.querySelectorAll<HTMLElement>('[data-slide]');
      let best = -1;
      let bestDist = Infinity;
      slides.forEach((el, i) => {
        const mid = el.offsetLeft + el.offsetWidth / 2;
        const d = Math.abs(mid - c);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      slides.forEach((el, i) => el.classList.toggle('is-active', i === best));
    };

    const apply = () => {
      wrap();
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      markActive();
    };

    const measure = () => {
      if (!alive) return;
      const slides = track.querySelectorAll<HTMLElement>('[data-slide]');
      const first = slides[0];
      if (!first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      step = first.getBoundingClientRect().width + gap;
      setWidth = step * (slides.length / 3);
      offset = -setWidth;
      apply();
    };

    const loop = () => {
      if (!dragging) {
        if (Math.abs(velocity) > 0.06) {
          offset += velocity;
          velocity *= 0.94;
          apply();
          raf = requestAnimationFrame(loop);
        } else if (snapping) {
          snapping = false;
          const target = Math.round(offset / step) * step;
          const animate = () => {
            offset += (target - offset) * 0.18;
            if (Math.abs(target - offset) < 0.5) {
              offset = target;
              apply();
              return;
            }
            apply();
            raf = requestAnimationFrame(animate);
          };
          animate();
        }
      }
    };

    // qualquer área do carrossel (inclusive sobre a imagem) inicia o arrasto;
    // o clique só dispara se o ponteiro soltar quase sem deslocamento.
    const DRAG_THRESHOLD = 5;
    let moved = 0;
    let suppressClick = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const el = e.target as Element | null;
      if (el?.closest('input, textarea, select')) return;
      dragging = true;
      moved = 0;
      suppressClick = false;
      window.dispatchEvent(new CustomEvent('cx:drag', { detail: true }));
      snapping = false;
      setGrabbing(true);
      startX = e.clientX;
      startOffset = offset;
      lastX = e.clientX;
      lastT = performance.now();
      velocity = 0;
      if (raf) cancelAnimationFrame(raf);
      viewport.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > DRAG_THRESHOLD) suppressClick = true;
      offset = startOffset + dx;
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = ((e.clientX - lastX) / dt) * 16;
      lastX = e.clientX;
      lastT = now;
      apply();
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      setGrabbing(false);
      window.dispatchEvent(new CustomEvent('cx:drag', { detail: false }));
      snapping = true;
      raf = requestAnimationFrame(loop);
      if (suppressClick) {
        // o próximo clique é consequência do arrasto: cancela uma vez
        const cancel = (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          window.removeEventListener('click', cancel, true);
          suppressClick = false;
        };
        window.addEventListener('click', cancel, true);
        window.setTimeout(() => {
          window.removeEventListener('click', cancel, true);
          suppressClick = false;
        }, 320);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      offset -= e.deltaX;
      apply();
      velocity = 0;
      snapping = true;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (!viewport.contains(document.activeElement)) return;
      e.preventDefault();
      offset += e.key === 'ArrowRight' ? -step : step;
      apply();
      velocity = 0;
      snapping = true;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    measure();

    if (reduce) {
      viewport.addEventListener('pointerdown', onPointerDown);
      viewport.addEventListener('pointermove', onPointerMove);
      viewport.addEventListener('pointerup', onPointerUp);
      viewport.addEventListener('pointercancel', onPointerUp);
      window.addEventListener('resize', measure);
      return () => {
        alive = false;
        window.removeEventListener('resize', measure);
        viewport.removeEventListener('pointerdown', onPointerDown);
        viewport.removeEventListener('pointermove', onPointerMove);
        viewport.removeEventListener('pointerup', onPointerUp);
        viewport.removeEventListener('pointercancel', onPointerUp);
      };
    }
    {
      // pequeno giro automático quando o usuário não interage
      let lastInteraction = performance.now();
      const bump = () => {
        if (!alive) return;
        if (dragging || snapping || Math.abs(velocity) > 0.06) return;
        if (performance.now() - lastInteraction < 3600) return;
        offset -= 0.35;
        apply();
      };
      idle = window.setInterval(bump, 16);
      const touch = () => {
        lastInteraction = performance.now();
      };
      // pausa o auto-scroll fora da tela
      const vis = new IntersectionObserver(([entry]) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        entry.isIntersecting ? null : (lastInteraction = performance.now());
      });
      vis.observe(viewport);
      viewport.addEventListener('pointerdown', touch);
      viewport.addEventListener('pointermove', touch);
      viewport.addEventListener('wheel', touch, { passive: true });
      window.addEventListener('resize', measure);
      viewport.addEventListener('pointerdown', onPointerDown);
      viewport.addEventListener('pointermove', onPointerMove);
      viewport.addEventListener('pointerup', onPointerUp);
      viewport.addEventListener('pointercancel', onPointerUp);
      viewport.addEventListener('wheel', onWheel, { passive: false });
      viewport.addEventListener('keydown', onKey);

      return () => {
        alive = false;
        vis.disconnect();
        if (idle) clearInterval(idle);
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', measure);
        viewport.removeEventListener('pointerdown', touch);
        viewport.removeEventListener('pointermove', touch);
        viewport.removeEventListener('wheel', touch);
        viewport.removeEventListener('pointerdown', onPointerDown);
        viewport.removeEventListener('pointermove', onPointerMove);
        viewport.removeEventListener('pointerup', onPointerUp);
        viewport.removeEventListener('pointercancel', onPointerUp);
        viewport.removeEventListener('wheel', onWheel);
        viewport.removeEventListener('keydown', onKey);
      };
    }
  }, [kids.length]);

  return (
    <div className="carousel">
      <div
        className={`carousel__viewport ${grabbing ? 'is-grabbing' : ''}`}
        ref={viewportRef}
        tabIndex={0}
        role="region"
        aria-label="Galeria — arraste para o lado"
        data-native-scroll
      >
        <div className="carousel__track" ref={trackRef}>
          {[0, 1, 2].map((copy) =>
            kids.map((child, i) => (
              <div className="carousel__slide" key={`${copy}-${i}`} data-slide>
                {child}
              </div>
            )),
          )}
        </div>
        <div className="carousel__edge carousel__edge--left" aria-hidden="true" />
        <div className="carousel__edge carousel__edge--right" aria-hidden="true" />
      </div>
      <p className="carousel__hint">
        <span className="carousel__hint-dot" /> Arraste para o lado
      </p>
    </div>
  );
}
