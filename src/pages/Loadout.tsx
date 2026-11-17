import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Category, type Loadout as LoadoutType, type Product } from '../lib/api';
import { formatBRL } from '../lib/format';
import { useAuth, useCart, useToast } from '../context/AppContext';
import { IconArrow, IconBag, IconCheck, IconClose, IconPlus, IconTrash } from '../components/icons';
import './loadout.css';

type Slot = { product: Product; size: string; quantity: number };

const DEFAULT_NAME = 'Meu próximo personagem';

export function LoadoutPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [activeCat, setActiveCat] = useState('todos');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [name, setName] = useState(DEFAULT_NAME);
  const [saved, setSaved] = useState<LoadoutType[]>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { add } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    setProducts(null);
    api.products({ category: activeCat }).then(setProducts).catch(() => setProducts([]));
  }, [activeCat]);

  useEffect(() => {
    if (user) api.loadouts().then(setSaved).catch(() => undefined);
    else setSaved([]);
  }, [user]);

  const total = slots.reduce((s, x) => s + x.product.price * x.quantity, 0);
  const count = slots.reduce((s, x) => s + x.quantity, 0);
  const compareTotal = slots.reduce((s, x) => s + (x.product.comparePrice || x.product.price) * x.quantity, 0);
  const savings = compareTotal - total;

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const list = map.get(s.product.category) || [];
      list.push(s);
      map.set(s.product.category, list);
    }
    return Array.from(map.entries());
  }, [slots]);

  const addProduct = (product: Product) => {
    setSlots((prev) => {
      const exists = prev.find((s) => s.product.id === product.id);
      if (exists) return prev;
      return [...prev, { product, size: product.sizes[0], quantity: 1 }];
    });
  };

  const removeProduct = (id: string) => setSlots((prev) => prev.filter((s) => s.product.id !== id));
  const setQty = (id: string, q: number) =>
    setSlots((prev) => prev.map((s) => (s.product.id === id ? { ...s, quantity: Math.max(1, Math.min(s.product.stock || 9, q)) } : s)));
  const setSize = (id: string, size: string) => setSlots((prev) => prev.map((s) => (s.product.id === id ? { ...s, size } : s)));

  const addAllToCart = () => {
    if (slots.length === 0) {
      notify({ tone: 'info', title: 'Seu loadout está vazio', message: 'Escolha ao menos uma peça para começar.' });
      return;
    }
    slots.forEach((s) => add(s.product, s.size, s.quantity));
    notify({ tone: 'success', title: 'Loadout na sacola', message: `${count} ${count === 1 ? 'peça adicionada' : 'peças adicionadas'}.` });
  };

  const save = async () => {
    if (!user) {
      notify({ tone: 'info', title: 'Entre para salvar', message: 'Sua composição fica guardada na sua conta Crossover.' });
      navigate('/entrar?next=/loadout');
      return;
    }
    if (slots.length === 0) return;
    setSaving(true);
    try {
      const created = await api.saveLoadout(
        name.trim() || DEFAULT_NAME,
        slots.map((s) => ({ productId: s.product.id, size: s.size, quantity: s.quantity })),
      );
      setSaved((prev) => [created, ...prev]);
      notify({ tone: 'success', title: 'Loadout salvo', message: `“${created.name}” está na sua conta.` });
    } catch (e) {
      notify({ tone: 'error', title: 'Não foi possível salvar', message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const loadSaved = async (l: LoadoutType) => {
    const all = await api.products();
    const map = new Map(all.map((p) => [p.id, p]));
    const next: Slot[] = l.items
      .map((i) => {
        const p = map.get(i.productId);
        return p ? { product: p, size: i.size, quantity: i.quantity } : null;
      })
      .filter(Boolean) as Slot[];
    setSlots(next);
    setName(l.name);
    notify({ tone: 'success', title: 'Loadout carregado', message: l.name });
  };

  const deleteSaved = async (id: number) => {
    await api.deleteLoadout(id);
    setSaved((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="loadout-page">
      <header className="lo-head">
        <div className="container lo-head__inner">
          <div>
            <p className="eyebrow">Assinatura Crossover</p>
            <h1 className="display lo-title">
              Loadout <em className="serif-italic">Builder</em>
            </h1>
            <p className="lede">
              Escolha as peças do seu personagem, veja o total se atualizar e leve tudo para a sacola quando estiver
              pronto. Sua prancheta, suas regras.
            </p>
          </div>
          <div className="lo-steps" aria-hidden="true">
            <span className="is-on">01 Escolher</span>
            <i />
            <span className={slots.length ? 'is-on' : ''}>02 Compor</span>
            <i />
            <span>03 Salvar</span>
          </div>
        </div>
      </header>

      <div className="container lo-body">
        <section className="lo-catalog">
          <div className="lo-cats">
            <button className={activeCat === 'todos' ? 'is-active' : ''} onClick={() => setActiveCat('todos')}>
              Todas
            </button>
            {categories.map((c) => (
              <button key={c.slug} className={activeCat === c.slug ? 'is-active' : ''} onClick={() => setActiveCat(c.slug)}>
                {c.name}
              </button>
            ))}
          </div>

          <div className="lo-grid">
            {products === null
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton lo-card-skeleton" />)
              : products.map((p) => {
                  const added = slots.some((s) => s.product.id === p.id);
                  return (
                    <button
                      key={p.id}
                      className={`lo-card ${added ? 'is-added' : ''}`}
                      onClick={() => (added ? removeProduct(p.id) : addProduct(p))}
                      aria-pressed={added}
                    >
                      <div className="lo-card__img">
                        <img src={p.images[0]} alt={p.name} loading="lazy" />
                        <span className="lo-card__toggle">{added ? <IconCheck size={16} /> : <IconPlus size={16} />}</span>
                      </div>
                      <div className="lo-card__body">
                        <p className="lo-card__cat">{categories.find((c) => c.slug === p.category)?.name}</p>
                        <p className="lo-card__name">{p.name}</p>
                        <p className="lo-card__price">{formatBRL(p.price)}</p>
                      </div>
                    </button>
                  );
                })}
          </div>
        </section>

        <aside className="lo-panel">
          <div className="lo-panel__head">
            <div>
              <p className="eyebrow">Sua prancheta</p>
              <input className="lo-panel__name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome do loadout" />
            </div>
            <span className="lo-panel__count">{count} {count === 1 ? 'peça' : 'peças'}</span>
          </div>

          <div className="lo-panel__body">
            {slots.length === 0 ? (
              <div className="lo-empty">
                <div className="lo-empty__icon">
                  <IconBag size={26} />
                </div>
                <p className="lo-empty__title">A prancheta está em branco.</p>
                <p>Comece pelo figurino — depois a peruca, os adereços e os detalhes.</p>
              </div>
            ) : (
              grouped.map(([cat, list]) => (
                <div key={cat} className="lo-group">
                  <p className="lo-group__title">{categories.find((c) => c.slug === cat)?.name || cat}</p>
                  {list.map((s) => (
                    <div className="lo-item" key={s.product.id}>
                      <img src={s.product.images[0]} alt="" />
                      <div className="lo-item__info">
                        <p className="lo-item__name">{s.product.name}</p>
                        <div className="lo-item__controls">
                          <select value={s.size} onChange={(e) => setSize(s.product.id, e.target.value)} aria-label="Tamanho">
                            {s.product.sizes.map((sz) => (
                              <option key={sz}>{sz}</option>
                            ))}
                          </select>
                          <div className="qty qty--sm">
                            <button onClick={() => setQty(s.product.id, s.quantity - 1)} aria-label="Menos">
                              −
                            </button>
                            <span key={s.quantity}>{s.quantity}</span>
                            <button onClick={() => setQty(s.product.id, s.quantity + 1)} aria-label="Mais">
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="lo-item__side">
                        <b>{formatBRL(s.product.price * s.quantity)}</b>
                        <button onClick={() => removeProduct(s.product.id)} aria-label="Remover peça">
                          <IconClose size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="lo-panel__foot">
            <div className="lo-total">
              <div>
                <span>Total do loadout</span>
                {savings > 0 && <em>você economiza {formatBRL(savings)}</em>}
              </div>
              <strong key={total}>{formatBRL(total)}</strong>
            </div>
            <div className="lo-actions">
              <button className="btn" onClick={addAllToCart}>
                <span>
                  Adicionar tudo à sacola <IconArrow size={16} />
                </span>
              </button>
              <button className="btn btn--ghost" onClick={save} disabled={saving || slots.length === 0}>
                <span>{saving ? 'Salvando…' : 'Salvar loadout'}</span>
              </button>
            </div>
            {slots.length > 0 && (
              <button className="lo-clear" onClick={() => setSlots([])}>
                <IconTrash size={13} /> Limpar prancheta
              </button>
            )}
          </div>
        </aside>
      </div>

      <section className="lo-saved">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Loadouts salvos</p>
              <h2 className="display section-head__title">Seus personagens em espera.</h2>
            </div>
            {!user && (
              <Link to="/entrar?next=/loadout" className="link-underline">
                Entrar para salvar <IconArrow size={14} />
              </Link>
            )}
          </div>
          {user && saved.length === 0 && (
            <p className="lo-saved__empty">Nenhum loadout salvo ainda. Monte uma composição e clique em “Salvar loadout”.</p>
          )}
          {!user && (
            <p className="lo-saved__empty">
              Crie uma conta Crossover para guardar suas composições e voltar a elas quando quiser.
            </p>
          )}
          <div className="lo-saved__grid">
            {saved.map((l) => (
              <article className="lo-saved__card" key={l.id}>
                <div className="lo-saved__imgs">
                  {l.items.slice(0, 3).map((i) => {
                    const p = slots.find((s) => s.product.id === i.productId)?.product;
                    return p ? <img key={i.productId} src={p.images[0]} alt="" /> : <div key={i.productId} className="lo-saved__ph" />;
                  })}
                </div>
                <div className="lo-saved__meta">
                  <h3>{l.name}</h3>
                  <p>{l.items.length} peças</p>
                </div>
                <div className="lo-saved__actions">
                  <button onClick={() => loadSaved(l)} className="link-underline">
                    Carregar
                  </button>
                  <button onClick={() => deleteSaved(l.id)} aria-label="Excluir loadout">
                    <IconTrash size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
