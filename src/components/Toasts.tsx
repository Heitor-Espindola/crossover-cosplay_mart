import { useToast } from '../context/AppContext';
import { IconCheck, IconClose } from './icons';

export function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          <span className="toast__icon">{t.tone === 'error' ? <IconClose size={14} /> : <IconCheck size={14} />}</span>
          <div>
            <p className="toast__title">{t.title}</p>
            {t.message && <p className="toast__msg">{t.message}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} aria-label="Fechar aviso" className="toast__close">
            <IconClose size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
