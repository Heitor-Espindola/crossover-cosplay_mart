import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type Category, type Product } from '../lib/api';
import { ProductCard, ProductSkeleton } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';
import { IconClose, IconSearch } from '../components/icons';
import './shop.css';

const SORTS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'newest', label: 'Novidades' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'rating', label: 'Melhor avaliados' },
];

const PRICE_RANGES = [
  { label: 'Até R$ 200', min: '', max: '200' },
  { label: 'R$ 200 — R$ 500', min: '200', max: '500' },
  { label: 'R$ 500 — R$ 1.000', min: '500', max: '1000' },
  { label: 'Acima de R$ 1.000', min: '1000', max: '' },
];

export function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get('categoria') || 'todos';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'relevance';
  const min = params.get('min') || '';
  const max = params.get('max') || '';
  const featuredOnly = params.get('destaque') === '1';
  const [search, setSearch] = useState(q);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => setSearch(q), [q]);

  useEffect(() => {
    setProducts(null);
    api
      .products({ category, q, sort, min, max, featured: featuredOnly ? 'true' : undefined })
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [category, q, sort, min, max, featuredOnly]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const activeCategory = categories.find((c) => c.slug === category);
  const title = activeCategory ? activeCategory.name : q ? `Resultados para “${q}”` : 'Todas as vitrines';
  const subtitle = activeCategory
    ? activeCategory.description
    : 'Cosplay, games, quadrinhos, mangás e RPG — peças de vitrines independentes com curadoria Crossover.';

  const activeFilters = useMemo(
    () => [
      ...(category !== 'todos' ? [{ key: 'categoria', label: activeCategory?.name || category }] : []),
      ...(q ? [{ key: 'q', label: `Busca: ${q}` }] : []),
      ...(min || max ? [{ key: 'preco', label: PRICE_RANGES.find((r) => r.min === min && r.max === max)?.label || 'Faixa de preço' }] : []),
      ...(featuredOnly ? [{ key: 'destaque', label: 'Em destaque' }] : []),
    ],
    [category, q, min, max, featuredOnly, activeCategory],
  );

  return (
    <div className="shop">
      <header className="shop__head">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link to="/">Início</Link>
            <span>/</span>
            <Link to="/loja">Loja</Link>
            {activeCategory && (
              <>
                <span>/</span>
                <em>{activeCategory.name}</em>
              </>
            )}
          </nav>
          <div className="shop__head-row">
            <div>
              <h1 className="display shop__title">{title}</h1>
              <p className="shop__sub">{subtitle}</p>
            </div>
            <div className="shop__search">
              <IconSearch size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && update('q', search.trim())}
                placeholder="Buscar no catálogo"
                aria-label="Buscar no catálogo"
              />
              {search && (
                <button onClick={() => { setSearch(''); update('q', ''); }} aria-label="Limpar busca">
                  <IconClose size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container shop__body">
        <aside className={`shop__filters ${filtersOpen ? 'is-open' : ''}`}>
          <div className="shop__filters-head">
            <p className="eyebrow">Filtros</p>
            <button className="shop__filters-close" onClick={() => setFiltersOpen(false)} aria-label="Fechar filtros">
              <IconClose size={18} />
            </button>
          </div>

          <div className="filter-group">
            <p className="filter-group__title">Categoria</p>
            <button className={`filter-item ${category === 'todos' ? 'is-active' : ''}`} onClick={() => update('categoria', '')}>
              Todas as peças <span>{categories.reduce((s, c) => s + (c.productCount || 0), 0)}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                className={`filter-item ${category === c.slug ? 'is-active' : ''}`}
                onClick={() => update('categoria', c.slug)}
              >
                {c.name} <span>{c.productCount}</span>
              </button>
            ))}
          </div>

          <div className="filter-group">
            <p className="filter-group__title">Faixa de preço</p>
            {PRICE_RANGES.map((r) => (
              <button
                key={r.label}
                className={`filter-item ${min === r.min && max === r.max ? 'is-active' : ''}`}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (min === r.min && max === r.max) {
                    next.delete('min');
                    next.delete('max');
                  } else {
                    r.min ? next.set('min', r.min) : next.delete('min');
                    r.max ? next.set('max', r.max) : next.delete('max');
                  }
                  setParams(next, { replace: true });
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <p className="filter-group__title">Curadoria</p>
            <label className="filter-toggle">
              <input type="checkbox" checked={featuredOnly} onChange={(e) => update('destaque', e.target.checked ? '1' : '')} />
              <span>Apenas destaques</span>
            </label>
          </div>

          <button className="btn btn--ghost btn--sm btn--block" onClick={() => { clearAll(); setFiltersOpen(false); }}>
            <span>Limpar filtros</span>
          </button>
        </aside>

        <section className="shop__main">
          <div className="shop__toolbar">
            <button className="shop__filter-btn" onClick={() => setFiltersOpen(true)}>
              Filtros {activeFilters.length > 0 && <b>{activeFilters.length}</b>}
            </button>
            <div className="shop__chips">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  className="chip chip--active"
                  onClick={() => {
                    if (f.key === 'preco') {
                      const next = new URLSearchParams(params);
                      next.delete('min');
                      next.delete('max');
                      setParams(next, { replace: true });
                    } else update(f.key, '');
                  }}
                >
                  {f.label} <IconClose size={12} />
                </button>
              ))}
            </div>
            <div className="shop__sort">
              <label htmlFor="sort">Ordenar por</label>
              <select id="sort" value={sort} onChange={(e) => update('sort', e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="shop__count">
            {products ? `${products.length} ${products.length === 1 ? 'peça' : 'peças'}` : 'Carregando o catálogo…'}
          </p>

          {products === null ? (
            <div className="product-grid shop__grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__title">Nenhuma peça encontrada.</p>
              <p>Talvez o personagem ainda esteja em produção. Tente outra busca ou explore todas as categorias.</p>
              <button className="btn btn--ghost btn--sm" onClick={clearAll}>
                <span>Ver todo o catálogo</span>
              </button>
            </div>
          ) : (
            <div className="product-grid shop__grid">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}

          <Reveal className="shop__note">
            <p>
              Não encontrou o seu personagem? Várias vitrines aceitam encomenda — fale com a curadoria.{' '}
              <Link to="/contato" className="link-underline">
                Fale com a equipe
              </Link>
            </p>
          </Reveal>
        </section>
      </div>

      <div className={`shop__scrim ${filtersOpen ? 'is-open' : ''}`} onClick={() => setFiltersOpen(false)} />
    </div>
  );
}
