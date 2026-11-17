export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`} aria-label="Crossover Cosplay Mart">
      <svg className="logo__mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <circle cx="16" cy="16" r="14.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M21.6 9.4 10.4 22.6M10.4 9.4l11.2 13.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="logo__word">
        Crossover
        {!compact && <em>Cosplay Mart</em>}
      </span>
    </span>
  );
}
