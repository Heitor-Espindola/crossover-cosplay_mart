import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../context/AppContext';
import { api, type Category, type Product } from '../lib/api';
import { formatBRL } from '../lib/format';
import { Logo } from './Logo';
import { IconArrow, IconBag, IconChevron, IconClose, IconMenu, IconSearch, IconUser } from './icons';
import { useScrollY } from '../hooks/useReveal';

const NAV = [
  { to: '/', label: 'Início', end: true },
  { to: '/loja', label: 'Loja' },
  { to: '/colecoes', label: 'Coleções' },
  { to: '/loadout', label: 'Loadout Builder' },
  { to: '/sobre', label: 'Sobre' },
];

export function Header() {
  const { count, openCart } = useCart();
  const { user } = useAuth();
  const y = useScrollY();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const isHome = location.pathname === '/';
  const transparent = isHome && y < 80 && !menuOpen && !searchOpen;
  const scrolled = y > 24;

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShopOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.classList.toggle('modal-open', menuOpen || searchOpen);
    return () => document.body.classList.remove('modal-open');
  }, [menuOpen, searchOpen]);

  const onShopLink = (href: string) => {
    setShopOpen(false);
    setMenuOpen(false);
    navigate(href);
  };

  return (
    <>
      <div className="announce">
        <div className="announce__track">
          <span>Frete grátis acima de R$ 499 para todo o Brasil</span>
          <i>·</i>
          <span>Marketplace de cosplay, games, mangá e RPG · envio de todo o Brasil</span>
          <i>·</i>
          <span>Parcele em até 6x sem juros</span>
          <i>·</i>
          <span>Nova coleção: Ordem do Crepúsculo</span>
        </div>
      </div>
      <header className={`site-header ${transparent ? 'is-transparent' : ''} ${scrolled ? 'is-scrolled' : ''} ${transparent ? 'on-dark' : ''}`}>
        <div className="site-header__inner container">
          <button className="icon-btn site-header__burger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <IconMenu size={22} />
          </button>

          <Link to="/" className="site-header__logo" aria-label="Crossover — página inicial">
            <Logo light={transparent} />
          </Link>

          <nav className="site-header__nav" aria-label="Navegação principal">
            {NAV.map((item) =>
              item.to === '/loja' ? (
                <div
                  key={item.to}
                  className="nav-drop"
                  onMouseEnter={() => setShopOpen(true)}
                  onMouseLeave={() => setShopOpen(false)}
                >
                  <NavLink to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                    {item.label}
                    <IconChevron size={13} className="nav-drop__chev" />
                  </NavLink>
                  <div className={`nav-drop__panel ${shopOpen ? 'is-open' : ''}`}>
                    <div className="nav-drop__inner">
                      <div className="nav-drop__col">
                        <p className="eyebrow">Categorias</p>
                        {categories.map((c) => (
                          <button key={c.slug} onClick={() => onShopLink(`/loja?categoria=${c.slug}`)} className="nav-drop__link">
                            {c.name}
                            <span>{c.productCount ?? ''}</span>
                          </button>
                        ))}
                      </div>
                      <div className="nav-drop__feature">
                        <img src="/img/studio/editorial-mood.jpg" alt="" loading="lazy" />
                        <div>
                          <p className="eyebrow">Destaque</p>
                          <p className="nav-drop__title">Ordem do Crepúsculo</p>
                          <button className="link-underline" onClick={() => onShopLink('/colecoes/ordem-do-crepusculo')}>
                            Ver coleção <IconArrow size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="site-header__actions">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar">
              <IconSearch size={20} />
            </button>
            <Link to={user ? '/conta' : '/entrar'} className="icon-btn account-btn" aria-label={user ? 'Minha conta' : 'Entrar'}>
              <IconUser size={20} />
              <span className="account-btn__label">{user ? user.name.split(' ')[0] : 'Entrar'}</span>
            </Link>
            <button className="icon-btn cart-btn" onClick={openCart} aria-label={`Carrinho, ${count} itens`}>
              <IconBag size={20} />
              <span className={`cart-btn__count ${count > 0 ? 'is-on' : ''}`} key={count}>
                {count}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* menu mobile */}
      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu__top container">
          <Logo />
          <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <IconClose size={22} />
          </button>
        </div>
        <nav className="mobile-menu__nav container">
          {NAV.map((item, i) => (
            <Link key={item.to} to={item.to} style={{ ['--i' as string]: i }} className="mobile-menu__link">
              <span className="mobile-menu__index">0{i + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu__cats container">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.slug} to={`/loja?categoria=${c.slug}`} className="mobile-menu__chip">
              {c.name}
            </Link>
          ))}
        </div>
        <div className="mobile-menu__foot container">
          <Link to={user ? '/conta' : '/entrar'} className="btn btn--ghost btn--block">
            <span>{user ? 'Minha conta' : 'Entrar ou criar conta'}</span>
          </Link>
          <p className="mobile-menu__note">Crossover Cosplay Mart · contato@crossovercosplay.com.br</p>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [data, setData] = useState<{ products: Product[]; categories: Category[]; collections: string[] }>({
    products: [],
    categories: [],
    collections: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setQ('');
      setData({ products: [], categories: [], collections: [] });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setData({ products: [], categories: [], collections: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api
        .suggestions(q.trim())
        .then(setData)
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (href: string) => {
    onClose();
    navigate(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    go(`/loja?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className={`search-overlay ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="search-overlay__inner container">
        <div className="search-overlay__top">
          <form className="search-overlay__form" onSubmit={submit}>
            <IconSearch size={24} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busque por figurinos, perucas, armaduras…"
              aria-label="Buscar produtos"
            />
          </form>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar busca">
            <IconClose size={24} />
          </button>
        </div>

        {q.trim().length >= 2 ? (
          <div className="search-results">
            {loading && <p className="search-results__hint">Buscando no catálogo…</p>}
            {!loading && data.products.length === 0 && data.categories.length === 0 && (
              <p className="search-results__hint">
                Nada encontrado para “{q}”. Tente “peruca”, “armadura” ou “cavaleira”.
              </p>
            )}
            {data.products.length > 0 && (
              <div className="search-results__group">
                <p className="eyebrow">Peças</p>
                {data.products.map((p) => (
                  <button key={p.id} className="search-result" onClick={() => go(`/produto/${p.slug}`)}>
                    <img src={p.images[0]} alt="" loading="lazy" />
                    <span>
                      <strong>{p.name}</strong>
                      <em>{p.collection}</em>
                    </span>
                    <b>{formatBRL(p.price)}</b>
                  </button>
                ))}
              </div>
            )}
            {(data.categories.length > 0 || data.collections.length > 0) && (
              <div className="search-results__group">
                <p className="eyebrow">Coleções e categorias</p>
                <div className="search-results__chips">
                  {data.categories.map((c) => (
                    <button key={c.slug} className="chip" onClick={() => go(`/loja?categoria=${c.slug}`)}>
                      {c.name}
                    </button>
                  ))}
                  {data.collections.map((c) => (
                    <button
                      key={c}
                      className="chip"
                      onClick={() => go(`/colecoes/${c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="search-suggest">
            <p className="eyebrow">Sugestões</p>
            <div className="search-results__chips">
              {['Perucas', 'Armaduras', 'Kits completos', 'Adereços', 'Materiais DIY'].map((s) => (
                <button key={s} className="chip" onClick={() => go(`/loja?q=${encodeURIComponent(s)}`)}>
                  {s}
                </button>
              ))}
            </div>
            <p className="search-suggest__egg">
              Dica: digite “cavaleira” para encontrar a peça mais fotografada da vitrine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
