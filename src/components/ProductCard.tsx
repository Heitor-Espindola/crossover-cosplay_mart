import { Link } from 'react-router-dom';
import type { Product } from '../lib/api';
import { discountPercent, formatBRL, stockLabel } from '../lib/format';
import { useFavorites, useToast } from '../context/AppContext';
import { IconHeart } from './icons';

export function Rating({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="rating" aria-label={`Avaliação ${value} de 5`}>
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`rating__star ${i <= Math.round(value) ? 'is-on' : ''}`}>
            ★
          </span>
        ))}
      </span>
      <span className="rating__value" style={{ fontSize: size }}>
        {value.toFixed(1)}
        {count !== undefined && <em> ({count})</em>}
      </span>
    </span>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { has, toggle } = useFavorites();
  const { notify } = useToast();
  const fav = has(product.id);
  const off = discountPercent(product.price, product.comparePrice);
  const stock = stockLabel(product.stock);

  const onFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggle(product.id);
      notify({
        tone: 'success',
        title: fav ? 'Removido dos favoritos' : 'Guardado nos favoritos',
        message: fav ? product.name : `${product.name} está na sua lista.`,
      });
    } catch {
      notify({ tone: 'error', title: 'Entre para salvar favoritos', message: 'Crie sua conta Crossover em segundos.' });
    }
  };

  return (
    <article className="pcard" style={{ ['--i' as string]: index }}>
      <Link to={`/produto/${product.slug}`} className="pcard__media">
        <img src={product.images[0]} alt={product.name} loading="lazy" />
        {product.images[1] && (
          <img className="pcard__media-alt" src={product.images[1]} alt="" loading="lazy" aria-hidden="true" />
        )}
        <div className="pcard__badges">
          {product.badge && <span className="badge">{product.badge}</span>}
          {off > 0 && <span className="badge badge--sale">-{off}%</span>}
        </div>
        <button className={`pcard__fav ${fav ? 'is-on' : ''}`} onClick={onFav} aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
          <IconHeart size={17} filled={fav} />
        </button>
        <span className={`pcard__stock pcard__stock--${stock.tone}`}>{stock.label}</span>
      </Link>
      <div className="pcard__body">
        <p className="pcard__collection">{product.collection}</p>
        <h3 className="pcard__name">
          <Link to={`/produto/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="pcard__foot">
          <p className="pcard__price">
            <span>{formatBRL(product.price)}</span>
            {product.comparePrice && <s>{formatBRL(product.comparePrice)}</s>}
          </p>
          <Rating value={product.rating} count={product.reviewCount} />
        </div>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="pcard pcard--skeleton" aria-hidden="true">
      <div className="pcard__media skeleton" />
      <div className="pcard__body">
        <div className="skeleton skeleton--line" style={{ width: '40%' }} />
        <div className="skeleton skeleton--line" style={{ width: '80%' }} />
        <div className="skeleton skeleton--line" style={{ width: '55%' }} />
      </div>
    </div>
  );
}
