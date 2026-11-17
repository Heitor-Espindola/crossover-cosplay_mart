import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { api, type Address, type Loadout, type Order, type Product } from '../lib/api';
import { formatBRL, formatDate, formatCEP, formatPhone, formatCPF, ORDER_STATUS } from '../lib/format';
import { useAuth, useFavorites, useToast } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { IconArrow, IconClose, IconPlus, IconTrash } from '../components/icons';
import './account.css';

const NAV = [
  { to: '/conta', label: 'Visão geral', end: true },
  { to: '/conta/pedidos', label: 'Pedidos' },
  { to: '/conta/favoritos', label: 'Favoritos' },
  { to: '/conta/loadouts', label: 'Loadouts' },
  { to: '/conta/enderecos', label: 'Endereços' },
  { to: '/conta/dados', label: 'Dados pessoais' },
];

export function AccountLayout() {
  const { user, loading, logout } = useAuth();
  const { notify } = useToast();

  if (loading) {
    return (
      <div className="container account-loading">
        <div className="skeleton" style={{ height: 40, width: 240, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/entrar?next=/conta" replace />;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="account">
      <div className="container account__grid">
        <aside className="account__nav">
          <div className="account__id">
            <div className="account__avatar">{initials}</div>
            <div>
              <p className="account__name">{user.name}</p>
              <p className="account__email">{user.email}</p>
            </div>
          </div>
          <nav className="account__links">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {n.label}
              </NavLink>
            ))}
            {user.role === 'admin' && (
              <Link to="/admin" className="account__admin-link">
                Painel administrativo <IconArrow size={13} />
              </Link>
            )}
          </nav>
          <button
            className="account__logout"
            onClick={async () => {
              await logout();
              notify({ tone: 'info', title: 'Sessão encerrada', message: 'Até a próxima visita.' });
            }}
          >
            Sair da conta
          </button>
        </aside>
        <div className="account__main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AccountOverview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [favorites, setFavorites] = useState<Product[] | null>(null);

  useEffect(() => {
    api.orders().then(setOrders).catch(() => setOrders([]));
    api.favorites().then(setFavorites).catch(() => setFavorites([]));
  }, []);

  const spent = (orders || []).reduce((s, o) => s + o.total, 0);
  const last = orders?.[0];

  return (
    <>
      <header className="account__head">
        <p className="eyebrow">Minha conta</p>
        <h1 className="display account__title">Olá, {user?.name.split(' ')[0]}.</h1>
        <p className="account__sub">Aqui está o que você guardou, comprou e ainda vai vestir.</p>
      </header>

      <div className="account-stats">
        <div>
          <span>Pedidos</span>
          <strong>{orders ? orders.length : '—'}</strong>
        </div>
        <div>
          <span>Favoritos</span>
          <strong>{favorites ? favorites.length : '—'}</strong>
        </div>
        <div>
          <span>Total investido</span>
          <strong>{orders ? formatBRL(spent) : '—'}</strong>
        </div>
      </div>

      <section className="account-block">
        <div className="account-block__head">
          <h2 className="account-block__title">Último pedido</h2>
          <Link to="/conta/pedidos" className="link-underline">
            Ver todos <IconArrow size={13} />
          </Link>
        </div>
        {last ? (
          <article className="order-card">
            <div className="order-card__head">
              <div>
                <p className="order-card__id">{last.id}</p>
                <p className="order-card__date">{formatDate(last.createdAt)}</p>
              </div>
              <span className={`status status--${last.status}`}>{ORDER_STATUS[last.status]?.label || last.status}</span>
            </div>
            <div className="order-card__items">
              {last.items.slice(0, 4).map((i) => (
                <img key={i.productId} src={i.image} alt={i.name} />
              ))}
              <div className="order-card__total">
                <span>{last.items.length} {last.items.length === 1 ? 'peça' : 'peças'}</span>
                <strong>{formatBRL(last.total)}</strong>
              </div>
            </div>
          </article>
        ) : (
          <p className="account-empty">Você ainda não fez pedidos. Sua primeira composição espera por você.</p>
        )}
      </section>

      <section className="account-block">
        <div className="account-block__head">
          <h2 className="account-block__title">Favoritos</h2>
          <Link to="/conta/favoritos" className="link-underline">
            Ver todos <IconArrow size={13} />
          </Link>
        </div>
        {favorites && favorites.length > 0 ? (
          <div className="account-mini-grid">
            {favorites.slice(0, 3).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <p className="account-empty">Nada salvo ainda. Toque no coração de uma peça para guardá-la aqui.</p>
        )}
      </section>
    </>
  );
}

export function AccountOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api.orders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <>
      <header className="account__head">
        <p className="eyebrow">Histórico</p>
        <h1 className="display account__title">Meus pedidos</h1>
      </header>
      {orders === null && <div className="skeleton" style={{ height: 220 }} />}
      {orders && orders.length === 0 && (
        <div className="account-empty-block">
          <p className="account-empty">Nenhum pedido ainda.</p>
          <Link to="/loja" className="btn btn--sm">
            <span>Explorar a loja</span>
          </Link>
        </div>
      )}
      <div className="orders-list">
        {orders?.map((o) => (
          <article className="order-card" key={o.id}>
            <div className="order-card__head">
              <div>
                <p className="order-card__id">{o.id}</p>
                <p className="order-card__date">{formatDate(o.createdAt)}</p>
              </div>
              <span className={`status status--${o.status}`}>{ORDER_STATUS[o.status]?.label || o.status}</span>
            </div>
            <div className="order-card__body">
              {o.items.map((i) => (
                <div className="order-line" key={i.productId}>
                  <img src={i.image} alt={i.name} />
                  <div>
                    <p>{i.name}</p>
                    <span>
                      Tam. {i.size} · {i.quantity}x
                    </span>
                  </div>
                  <b>{formatBRL(i.unitPrice * i.quantity)}</b>
                </div>
              ))}
            </div>
            <div className="order-card__foot">
              <span>
                {o.shippingMethod} · {o.paymentMethod === 'pix' ? 'Pix' : o.paymentMethod === 'boleto' ? 'Boleto' : 'Cartão'} (simulado)
              </span>
              <strong>{formatBRL(o.total)}</strong>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export function AccountFavorites() {
  const { ids, toggle } = useFavorites();
  const [products, setProducts] = useState<Product[] | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    api.favorites().then(setProducts).catch(() => setProducts([]));
  }, []);

  const remove = async (p: Product) => {
    await toggle(p.id);
    setProducts((prev) => (prev || []).filter((x) => x.id !== p.id));
    notify({ tone: 'info', title: 'Removido dos favoritos', message: p.name });
  };

  return (
    <>
      <header className="account__head">
        <p className="eyebrow">Guardado</p>
        <h1 className="display account__title">Favoritos</h1>
        <p className="account__sub">{ids.length} {ids.length === 1 ? 'peça salva' : 'peças salvas'} para o próximo personagem.</p>
      </header>
      {products === null && <div className="skeleton" style={{ height: 300 }} />}
      {products && products.length === 0 && (
        <div className="account-empty-block">
          <p className="account-empty">Sua lista está vazia.</p>
          <Link to="/loja" className="btn btn--sm">
            <span>Encontrar peças</span>
          </Link>
        </div>
      )}
      <div className="account-mini-grid">
        {products?.map((p, i) => (
          <div key={p.id} className="fav-wrap">
            <ProductCard product={p} index={i} />
            <button className="fav-remove" onClick={() => remove(p)} aria-label="Remover dos favoritos">
              <IconClose size={13} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function AccountLoadouts() {
  const [loadouts, setLoadouts] = useState<Loadout[] | null>(null);
  const [all, setAll] = useState<Product[]>([]);

  useEffect(() => {
    api.loadouts().then(setLoadouts).catch(() => setLoadouts([]));
    api.products().then(setAll).catch(() => undefined);
  }, []);

  const productOf = (id: string) => all.find((p) => p.id === id);

  const remove = async (id: number) => {
    await api.deleteLoadout(id);
    setLoadouts((prev) => (prev || []).filter((l) => l.id !== id));
  };

  return (
    <>
      <header className="account__head">
        <p className="eyebrow">Composições</p>
        <h1 className="display account__title">Meus loadouts</h1>
        <p className="account__sub">Personagens que você montou e guardou na sua conta.</p>
      </header>
      <div className="lo-saved__grid account-loadouts">
        {loadouts?.map((l) => (
          <article className="lo-saved__card" key={l.id}>
            <div className="lo-saved__imgs">
              {l.items.slice(0, 3).map((i) => {
                const p = productOf(i.productId);
                return p ? <img key={i.productId} src={p.images[0]} alt="" /> : <div key={i.productId} className="lo-saved__ph" />;
              })}
            </div>
            <div className="lo-saved__meta">
              <h3>{l.name}</h3>
              <p>
                {l.items.length} peças ·{' '}
                {formatBRL(l.items.reduce((s, i) => s + (productOf(i.productId)?.price || 0) * i.quantity, 0))}
              </p>
            </div>
            <div className="lo-saved__actions">
              <Link to="/loadout" className="link-underline">
                Abrir builder
              </Link>
              <button onClick={() => remove(l.id)} aria-label="Excluir">
                <IconTrash size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {loadouts && loadouts.length === 0 && (
        <div className="account-empty-block">
          <p className="account-empty">Nenhum loadout salvo.</p>
          <Link to="/loadout" className="btn btn--sm">
            <span>Montar agora</span>
          </Link>
        </div>
      )}
    </>
  );
}

const EMPTY_ADDRESS = {
  label: 'Casa',
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  isDefault: false,
};

export function AccountAddresses() {
  const [list, setList] = useState<Address[] | null>(null);
  const [form, setForm] = useState({ ...EMPTY_ADDRESS });
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const { notify } = useToast();

  const load = () => api.addresses().then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.updateAddress(editing, form);
      else await api.addAddress(form);
      notify({ tone: 'success', title: 'Endereço salvo' });
      setOpen(false);
      setEditing(null);
      setForm({ ...EMPTY_ADDRESS });
      load();
    } catch (err) {
      notify({ tone: 'error', title: 'Erro ao salvar', message: (err as Error).message });
    }
  };

  const edit = (a: Address) => {
    setForm({ ...a });
    setEditing(a.id);
    setOpen(true);
  };

  const remove = async (id: number) => {
    await api.removeAddress(id);
    load();
  };

  return (
    <>
      <header className="account__head">
        <p className="eyebrow">Entregas</p>
        <h1 className="display account__title">Endereços</h1>
      </header>
      <div className="addr-grid">
        {list?.map((a) => (
          <div className={`addr-card ${a.isDefault ? 'is-default' : ''}`} key={a.id}>
            <div className="addr-card__head">
              <p className="eyebrow">{a.label}</p>
              {a.isDefault && <span className="addr-badge">Principal</span>}
            </div>
            <p>
              {a.street}, {a.number}
              {a.complement ? ` — ${a.complement}` : ''}
            </p>
            <p className="co-muted">
              {a.district} · {a.city} — {a.state}
            </p>
            <p className="co-muted">CEP {formatCEP(a.cep)}</p>
            <div className="addr-card__actions">
              <button onClick={() => edit(a)} className="link-underline">
                Editar
              </button>
              <button onClick={() => remove(a.id)} aria-label="Remover">
                <IconTrash size={14} />
              </button>
            </div>
          </div>
        ))}
        <button className="addr-add" onClick={() => { setForm({ ...EMPTY_ADDRESS }); setEditing(null); setOpen(true); }}>
          <IconPlus size={20} />
          Adicionar endereço
        </button>
      </div>

      {open && (
        <div className="addr-form-wrap">
          <form className="addr-form" onSubmit={submit}>
            <div className="account-block__head">
              <h2 className="account-block__title">{editing ? 'Editar endereço' : 'Novo endereço'}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                <IconClose size={16} />
              </button>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Identificação</label>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Casa, Trabalho…" />
              </div>
              <div className="field">
                <label>CEP</label>
                <input value={form.cep} onChange={(e) => setForm({ ...form, cep: formatCEP(e.target.value) })} required placeholder="00000-000" />
              </div>
              <div className="field span-2">
                <label>Rua</label>
                <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
              </div>
              <div className="field">
                <label>Número</label>
                <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
              </div>
              <div className="field">
                <label>Complemento</label>
                <input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
              </div>
              <div className="field">
                <label>Bairro</label>
                <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
              <div className="field">
                <label>Cidade</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div className="field">
                <label>Estado</label>
                <input value={form.state} maxLength={2} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} required />
              </div>
              <label className="check-line">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                Usar como endereço principal
              </label>
            </div>
            <button className="btn" type="submit">
              <span>Salvar endereço</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export function AccountProfile() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', cpf: user?.cpf || '' });
  const [pass, setPass] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateAccount(form);
      setUser(updated.user);
      notify({ tone: 'success', title: 'Dados atualizados' });
    } catch (err) {
      notify({ tone: 'error', title: 'Erro', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const changePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.next.length < 6) return notify({ tone: 'error', title: 'Senha curta', message: 'Use ao menos 6 caracteres.' });
    if (pass.next !== pass.confirm) return notify({ tone: 'error', title: 'Senhas diferentes', message: 'Confira a confirmação.' });
    try {
      await api.changePassword(pass.current, pass.next);
      notify({ tone: 'success', title: 'Senha alterada' });
      setPass({ current: '', next: '', confirm: '' });
    } catch (err) {
      notify({ tone: 'error', title: 'Erro', message: (err as Error).message });
    }
  };

  return (
    <>
      <header className="account__head">
        <p className="eyebrow">Conta</p>
        <h1 className="display account__title">Dados pessoais</h1>
      </header>
      <form className="account-form" onSubmit={save}>
        <div className="form-grid">
          <div className="field span-2">
            <label>Nome completo</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Telefone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-0000" />
          </div>
          <div className="field">
            <label>CPF</label>
            <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" />
          </div>
        </div>
        <button className="btn btn--sm" disabled={saving}>
          <span>{saving ? 'Salvando…' : 'Salvar alterações'}</span>
        </button>
      </form>

      <form className="account-form" onSubmit={changePass}>
        <h2 className="account-block__title">Alterar senha</h2>
        <div className="form-grid">
          <div className="field">
            <label>Senha atual</label>
            <input type="password" value={pass.current} onChange={(e) => setPass({ ...pass, current: e.target.value })} />
          </div>
          <div className="field">
            <label>Nova senha</label>
            <input type="password" value={pass.next} onChange={(e) => setPass({ ...pass, next: e.target.value })} />
          </div>
          <div className="field">
            <label>Confirmar nova senha</label>
            <input type="password" value={pass.confirm} onChange={(e) => setPass({ ...pass, confirm: e.target.value })} />
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" type="submit">
          <span>Atualizar senha</span>
        </button>
      </form>
    </>
  );
}
