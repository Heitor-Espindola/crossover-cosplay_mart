import { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReveal';

/**
 * Abertura da home: a marca se desenha, o miolo se abre e a máscara
 * sobe com um morph de borda. Só roda uma vez por sessão.
 */
export function Splash() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in');

  useEffect(() => {
    if (reduced) {
      setPhase('done');
      return;
    }
    if (sessionStorage.getItem('cx_splash') === '1') {
      setPhase('done');
      return;
    }
    document.body.style.overflow = 'hidden';
    const t1 = window.setTimeout(() => setPhase('out'), 1750);
    const t2 = window.setTimeout(() => {
      setPhase('done');
      sessionStorage.setItem('cx_splash', '1');
      document.body.style.overflow = '';
    }, 2550);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.body.style.overflow = '';
    };
  }, [reduced]);

  if (phase === 'done') return null;

  return (
    <div className={`splash ${phase === 'out' ? 'is-out' : ''}`} aria-hidden="true">
      <div className="splash__bg" />
      <div className="splash__mark">
        <svg viewBox="0 0 120 120" className="splash__svg">
          <defs>
            <linearGradient id="cxGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a884e0" />
              <stop offset="55%" stopColor="#7b45c4" />
              <stop offset="100%" stopColor="#f09b0e" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="52" className="splash__ring" />
          <path d="M44 36 L76 84 M76 36 L44 84" className="splash__x" />
        </svg>
        <span className="splash__word">Crossover</span>
        <span className="splash__sub">Cosplay Mart</span>
      </div>
      <div className="splash__count">
        <span />
      </div>
    </div>
  );
}
