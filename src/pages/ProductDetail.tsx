import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type ProductDetail as PD } from '../lib/api';
import { discountPercent, formatBRL, stockLabel } from '../lib/format';
import { useCart, useFavorites, useToast, recordRecentlyViewed, getRecentlyViewed } from '../context/AppContext';
import { ProductCard, Rating } from '../components/ProductCard';
import { IconArrow, IconCheck, IconHeart, IconMinus, IconPlus, IconShield, IconSparkle, IconTruck } from '../components/icons';
import { Reveal } from '../components/Reveal';
import './product.css';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const [product, setProduct] = useState<PD | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<'descricao' | 'especificacoes' | 'avaliacoes'>('descricao');
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const { notify } = useToast();
  const recent = useMemo(() => getRecentlyViewed(), [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setProduct(null);
    setNotFound(false);
    setImageIndex(0);
    setQuantity(1);
    api
      .product(slug)
      .then((p) => {
        setProduct(p);
        setSize(p.sizes[0]);
        recordRecentlyViewed(p);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container empty-page">
        <p className="eyebrow">404</p>
        <h1 className="display">Esta peça saiu da vitrine.</h1>
        <p>Talvez ela tenha sido renomeada ou esteja em produção novamente.</p>
        <Link to="/loja" className="btn">
          <span>Voltar para a loja</span>
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container pdp pdp--loading">
        <div className="pdp__gallery">
          <div className="skeleton" style={{ aspectRatio: '4/5' }} />
        </div>
        <div className="pdp__info">
          <div className="skeleton skeleton--line" style={{ width: '30%' }} />
          <div className="skeleton skeleton--line" style={{ width: '80%', height: 28 }} />
          <div className="skeleton skeleton--line" style={{ width: '40%' }} />
          <div className="skeleton skeleton--line" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  const stock = stockLabel(product.stock);
  const off = discountPercent(product.price, product.comparePrice);
  const fav = has(product.id);
  const outOfStock = product.stock <= 0;

  const addToCart = () => {
    if (outOfStock) return;
    add(product, size, quantity);
    notify({ tone: 'success', title: 'Adicionado à sacola', message: `${product.name} · Tam. ${size}` });
  };

  return (
    <div className="pdp-page">
      <div className="container">
        <nav className="crumbs" aria-label="Você está em">
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/loja">Loja</Link>
          <span>/</span>
          <Link to={`/loja?categoria=${product.category}`}>{product.category}</Link>
          <span>/</span>
          <em>{product.name}</em>
        </nav>

        <div className="pdp">
          <div className="pdp__gallery">
            <div className="pdp__thumbs">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  className={`pdp__thumb ${i === imageIndex ? 'is-active' : ''}`}
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver imagem ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            <div className="pdp__main">
              <div className="pdp__main-inner">
                {product.images.map((src, i) => (
                  <img key={src} src={src} alt={`${product.name} — imagem ${i + 1}`} className={i === imageIndex ? 'is-on' : ''} />
                ))}
              </div>
              {product.badge && <span className="badge pdp__badge">{product.badge}</span>}
              <div className="pdp__dots" aria-hidden="true">
                {product.images.map((_, i) => (
                  <span key={i} className={i === imageIndex ? 'is-on' : ''} />
                ))}
              </div>
            </div>
            <div className="pdp__mobile-thumbs">
              {product.images.map((src, i) => (
                <button key={src} onClick={() => setImageIndex(i)} className={i === imageIndex ? 'is-active' : ''} aria-label={`Imagem ${i + 1}`}>
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          <div className="pdp__info">
            <p className="eyebrow">{product.collection}</p>
            <h1 className="pdp__title">{product.name}</h1>
            <div className="pdp__rating">
              <Rating value={product.rating} count={product.reviewCount} />
              <button className="pdp__rating-link" onClick={() => setTab('avaliacoes')}>
                Ver avaliações
              </button>
            </div>

            <div className="pdp__price">
              <span className="pdp__price-now">{formatBRL(product.price)}</span>
              {product.comparePrice && <s className="pdp__price-old">{formatBRL(product.comparePrice)}</s>}
              {off > 0 && <span className="pdp__price-off">-{off}%</span>}
            </div>
            <p className="pdp__installments">
              ou <strong>6x de {formatBRL(product.price / 6)}</strong> sem juros · Pix com 5% de desconto (simulado)
            </p>

            <p className="pdp__short">{product.shortDescription}</p>

            <div className={`pdp__stock pdp__stock--${stock.tone}`}>
              <span />
              {stock.label}
            </div>

            <div className="pdp__option">
              <div className="pdp__option-head">
                <p className="field-label">Tamanho</p>
                <span>{product.sizes.join(' · ')}</span>
              </div>
              <div className="pdp__sizes">
                {product.sizes.map((s) => (
                  <button key={s} className={`size-chip ${size === s ? 'is-active' : ''}`} onClick={() => setSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pdp__buy">
              <div className="qty">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade">
                  <IconMinus size={14} />
                </button>
                <span key={quantity}>{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))} aria-label="Aumentar quantidade">
                  <IconPlus size={14} />
                </button>
              </div>
              <button className="btn pdp__add" onClick={addToCart} disabled={outOfStock}>
                <span>{outOfStock ? 'Esgotado' : 'Adicionar à sacola'} <IconArrow size={16} /></span>
              </button>
              <button
                className={`pdp__fav ${fav ? 'is-on' : ''}`}
                onClick={() => toggle(product.id)}
                aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <IconHeart size={19} filled={fav} />
              </button>
            </div>

            <div className="pdp__perks">
              <div>
                <IconTruck size={18} />
                <span>Frete grátis acima de R$ 499 · {formatBRL(19.9)} SP</span>
              </div>
              <div>
                <IconSparkle size={18} />
                <span>Enviado pela vitrine — {product.specs['Produção'] || 'pronta entrega'}</span>
              </div>
              <div>
                <IconShield size={18} />
                <span>30 dias para troca em toda a plataforma</span>
              </div>
            </div>

            {product.details && (
              <p className="pdp__details">
                <IconCheck size={15} /> {product.details}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* tabs */}
      <section className="pdp-tabs container">
        <div className="pdp-tabs__nav">
          {(
            [
              ['descricao', 'Descrição'],
              ['especificacoes', 'Especificações'],
              ['avaliacoes', `Avaliações (${product.reviews.length})`],
            ] as const
          ).map(([key, label]) => (
            <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="pdp-tabs__body">
          {tab === 'descricao' && (
            <div className="pdp-tabs__prose">
              <p>{product.description}</p>
              {product.details && <p className="pdp-tabs__note">{product.details}</p>}
            </div>
          )}
          {tab === 'especificacoes' && (
            <dl className="pdp-specs">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === 'avaliacoes' && (
            <div className="pdp-reviews">
              <div className="pdp-reviews__summary">
                <span className="pdp-reviews__avg">{product.rating.toFixed(1)}</span>
                <Rating value={product.rating} count={product.reviewCount} />
                <p>Média de {product.reviewCount} avaliações verificadas.</p>
              </div>
              <ul className="pdp-reviews__list">
                {product.reviews.length === 0 && <li className="pdp-reviews__empty">Ainda não há avaliações aprovadas para esta peça.</li>}
                {product.reviews.map((r) => (
                  <li key={r.id}>
                    <div className="pdp-reviews__head">
                      <strong>{r.author}</strong>
                      <Rating value={r.rating} />
                    </div>
                    {r.title && <p className="pdp-reviews__title">{r.title}</p>}
                    <p className="pdp-reviews__body">{r.body}</p>
                  </li>
                ))}
              </ul>
              <ReviewForm productId={product.id} />
            </div>
          )}
        </div>
      </section>

      {product.related.length > 0 && (
        <section className="section pdp-related">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">Combina com</p>
                <h2 className="display section-head__title">
                  Complete o <em className="serif-italic">look</em>.
                </h2>
              </div>
              <Link to="/loadout" className="link-underline">
                Montar loadout <IconArrow size={14} />
              </Link>
            </div>
            <div className="product-grid">
              {product.related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {recent.filter((p) => p.id !== product.id).length > 0 && (
        <section className="pdp-recent">
          <div className="container">
            <Reveal>
              <p className="eyebrow">Vistos recentemente</p>
            </Reveal>
            <div className="pdp-recent__row">
              {recent
                .filter((p) => p.id !== product.id)
                .slice(0, 5)
                .map((p) => (
                  <Link key={p.id} to={`/produto/${p.slug}`} className="pdp-recent__item">
                    <img src={p.images[0]} alt={p.name} loading="lazy" />
                    <span>{p.name}</span>
                    <b>{formatBRL(p.price)}</b>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [sending, setSending] = useState(false);
  const { notify } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 10) {
      notify({ tone: 'error', title: 'Avaliação muito curta', message: 'Conte um pouco mais sobre a peça.' });
      return;
    }
    setSending(true);
    try {
      const res = await api.review(productId, { rating, title, body, author });
      notify({ tone: 'success', title: 'Avaliação enviada', message: res.message });
      setTitle('');
      setBody('');
    } catch (err) {
      notify({ tone: 'error', title: 'Não foi possível enviar', message: (err as Error).message });
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <p className="eyebrow">Escreva sua avaliação</p>
      <div className="review-form__stars" role="radiogroup" aria-label="Nota">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrelas`} className={n <= rating ? 'is-on' : ''}>
            ★
          </button>
        ))}
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="rv-name">Seu nome</label>
          <input id="rv-name" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Como você quer aparecer" />
        </div>
        <div className="field">
          <label htmlFor="rv-title">Título</label>
          <input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Acabamento impecável" />
        </div>
        <div className="field span-2">
          <label htmlFor="rv-body">Sua avaliação</label>
          <textarea id="rv-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="O que você achou da peça, do caimento, do acabamento…" />
        </div>
      </div>
      <button className="btn btn--sm" disabled={sending}>
        <span>{sending ? 'Enviando…' : 'Enviar avaliação'}</span>
      </button>
      <p className="review-form__note">As avaliações passam pela curadoria da equipe antes de aparecerem no site.</p>
    </form>
  );
}
