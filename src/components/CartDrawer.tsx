import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/AppContext';
import { formatBRL } from '../lib/format';
import { IconArrow, IconClose, IconMinus, IconPlus, IconTrash } from './icons';

export function CartDrawer() {
  const { isOpen, closeCart, lines, subtotal, setQuantity, remove, count } = useCart();
  const navigate = useNavigate();
  const freeShipping = 499;
  const missing = Math.max(0, freeShipping - subtotal);
  const progress = Math.min(100, (subtotal / freeShipping) * 100);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
    if (isOpen) {
      document.body.classList.add('modal-open');
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div className={`drawer-scrim ${isOpen ? 'is-open' : ''}`} onClick={closeCart} aria-hidden="true" />
      <aside className={`cart-drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen} aria-label="Carrinho">
        <div className="cart-drawer__head">
          <div>
            <p className="eyebrow">Sua sacola</p>
            <h3>{count === 0 ? 'Ainda está vazia' : 'Seu personagem começa aqui'}</h3>
          </div>
          <button className="icon-btn" onClick={closeCart} aria-label="Fechar carrinho">
            <IconClose size={22} />
          </button>
        </div>

        {lines.length > 0 && (
          <div className="cart-drawer__ship">
            <div className="cart-drawer__ship-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {missing > 0 ? (
                <>
                  Faltam <strong>{formatBRL(missing)}</strong> para o frete grátis.
                </>
              ) : (
                <>Frete grátis desbloqueado — a gente cuida do resto.</>
              )}
            </p>
          </div>
        )}

        <div className="cart-drawer__body">
          {lines.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty__title">Toda história começa com uma peça.</p>
              <p>Explore o catálogo e encontre a base do seu próximo personagem.</p>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  closeCart();
                  navigate('/loja');
                }}
              >
                <span>Explorar a loja <IconArrow size={16} /></span>
              </button>
            </div>
          ) : (
            <ul className="cart-lines">
              {lines.map((l) => (
                <li key={l.key} className="cart-line">
                  <Link to={`/produto/${l.slug}`} onClick={closeCart} className="cart-line__img">
                    <img src={l.image} alt={l.name} />
                  </Link>
                  <div className="cart-line__info">
                    <Link to={`/produto/${l.slug}`} onClick={closeCart} className="cart-line__name">
                      {l.name}
                    </Link>
                    <p className="cart-line__meta">Tam. {l.size}</p>
                    <div className="cart-line__row">
                      <div className="qty qty--sm">
                        <button onClick={() => setQuantity(l.key, l.quantity - 1)} aria-label="Diminuir quantidade">
                          <IconMinus size={13} />
                        </button>
                        <span key={l.quantity}>{l.quantity}</span>
                        <button onClick={() => setQuantity(l.key, l.quantity + 1)} aria-label="Aumentar quantidade">
                          <IconPlus size={13} />
                        </button>
                      </div>
                      <strong>{formatBRL(l.price * l.quantity)}</strong>
                    </div>
                  </div>
                  <button className="cart-line__remove" onClick={() => remove(l.key)} aria-label={`Remover ${l.name}`}>
                    <IconTrash size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="cart-drawer__foot">
            <div className="cart-drawer__sub">
              <span>Subtotal</span>
              <strong>{formatBRL(subtotal)}</strong>
            </div>
            <p className="cart-drawer__note">Frete e impostos calculados no checkout. Parcele em até 6x sem juros.</p>
            <button
              className="btn btn--block"
              onClick={() => {
                closeCart();
                navigate('/checkout');
              }}
            >
              <span>Finalizar compra <IconArrow size={16} /></span>
            </button>
            <button
              className="cart-drawer__continue"
              onClick={() => {
                closeCart();
                navigate('/loja');
              }}
            >
              Continuar explorando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
