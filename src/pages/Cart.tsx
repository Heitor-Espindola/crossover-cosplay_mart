import { Link } from 'react-router-dom';
import { formatBRL } from '../lib/format';
import { useCart } from '../context/AppContext';
import { IconArrow, IconLock, IconTrash } from '../components/icons';
import './cart.css';

export function CartPage() {
  const { lines, subtotal, count, setQuantity: setQty, remove, clear } = useCart();
  const freeFrom = 499;
  const missing = Math.max(0, freeFrom - subtotal);
  const progress = Math.min(100, (subtotal / freeFrom) * 100);

  if (lines.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container cart-empty__inner">
          <p className="eyebrow">Sacola</p>
          <h1 className="display cart-empty__title">
            Nada por aqui <em className="serif-italic">ainda</em>.
          </h1>
          <p className="cart-empty__sub">
            Sua sacola está vazia. Comece pelo figurino, ou monte um personagem completo no Loadout Builder.
          </p>
          <div className="cart-empty__ctas">
            <Link to="/loja" className="btn">
              <span>Explorar a loja <IconArrow size={16} /></span>
            </Link>
            <Link to="/loadout" className="btn btn--ghost">
              <span>Montar um loadout</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="container">
        <header className="cart__head">
          <div>
            <p className="eyebrow">Sacola</p>
            <h1 className="display cart__title">
              {count} {count === 1 ? 'peça' : 'peças'} <em className="serif-italic">escolhidas</em>
            </h1>
          </div>
          <button className="cart__clear" onClick={clear}>
            <IconTrash size={13} /> Esvaziar sacola
          </button>
        </header>

        <div className="cart__grid">
          <div className="cart__lines">
            <div className="cart-ship">
              <div className="cart-ship__bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>
                {missing > 0 ? (
                  <>
                    Faltam <strong>{formatBRL(missing)}</strong> para o frete grátis em todo o Brasil.
                  </>
                ) : (
                  <>
                    <strong>Frete grátis liberado</strong> — seu pedido passa de R$ 499.
                  </>
                )}
              </p>
            </div>

            {lines.map((l) => (
              <article className="cart-line" key={l.key}>
                <Link to={`/produto/${l.slug}`} className="cart-line__img">
                  <img src={l.image} alt={l.name} />
                </Link>
                <div className="cart-line__info">
                  <Link to={`/produto/${l.slug}`} className="cart-line__name">
                    {l.name}
                  </Link>
                  <p className="cart-line__meta">Tamanho {l.size}</p>
                  <div className="cart-line__controls">
                    <div className="qty qty--sm">
                      <button onClick={() => setQty(l.key, l.quantity - 1)} aria-label="Menos">−</button>
                      <span key={l.quantity}>{l.quantity}</span>
                      <button onClick={() => setQty(l.key, l.quantity + 1)} aria-label="Mais">+</button>
                    </div>
                    <button className="cart-line__remove" onClick={() => remove(l.key)}>
                      Remover
                    </button>
                  </div>
                </div>
                <div className="cart-line__price">
                  <b>{formatBRL(l.price * l.quantity)}</b>
                  {l.quantity > 1 && <em>{formatBRL(l.price)} cada</em>}
                </div>
              </article>
            ))}

            <div className="cart__continue">
              <Link to="/loja" className="link-underline">
                <span className="cart__back-arrow"><IconArrow size={14} /></span> Continuar comprando
              </Link>
            </div>
          </div>

          <aside className="cart__summary">
            <p className="eyebrow">Resumo</p>
            <div className="cart__rows">
              <div>
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div>
                <span>Frete</span>
                <span>{missing > 0 ? 'Calculado no checkout' : 'Grátis'}</span>
              </div>
              <div className="cart__note">
                <span>Peças feitas sob medida podem ter prazo de produção de 5 a 12 dias úteis.</span>
              </div>
            </div>
            <div className="cart__total">
              <span>Total estimado</span>
              <strong>{formatBRL(subtotal)}</strong>
            </div>
            <Link to="/checkout" className="btn btn--block">
              <span>Ir para o checkout <IconArrow size={16} /></span>
            </Link>
            <p className="cart__secure">
              <IconLock size={13} /> Ambiente simulado · nenhum pagamento real
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
