import { type ElementType, type ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

type Props = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  variant?: 'fade' | 'img' | 'words';
  threshold?: number;
  id?: string;
};

/** Wrapper de revelação no scroll. */
export function Reveal({ children, as: Tag = 'div', delay = 0, className = '', variant = 'fade', threshold, id }: Props) {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold });
  const base = variant === 'img' ? 'reveal-img' : variant === 'words' ? 'word-reveal' : 'reveal';
  return (
    <Tag
      id={id}
      ref={ref}
      className={`${base} ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ ['--d' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** Texto que entra palavra por palavra. */
export function Words({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const { ref, visible } = useReveal<HTMLSpanElement>({ threshold: 0.3 });
  const words = text.split(' ');
  return (
    <span ref={ref} className={`word-reveal ${visible ? 'is-visible' : ''} ${className}`.trim()} style={{ ['--d' as string]: `${delay}ms` }}>
      {words.map((w, i) => (
        <span className="word" key={`${w}-${i}`} style={{ ['--i' as string]: i }}>
          <span>{w}</span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
}
