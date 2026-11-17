import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { api, type AdminStats, type Category, type Order, type Product, type Review } from '../lib/api';
import { formatBRL, formatDate, ORDER_STATUS } from '../lib/format';
import { useAuth, useToast } from '../context/AppContext';
import { IconArrow, IconClose, IconPlus, IconTrash } from '../components/icons';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/avaliacoes', label: 'Avaliações' },
  { to: '/admin/clientes', label: 'Clientes' },
];

export function AdminLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="container account-loading"><div className="skeleton" style={{ height: 300 }} /></div>;
  if (!user) return <Navigate to="/entrar?next=/admin" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="container empty-page">
        <p className="eyebrow">Acesso restrito</p>
        <h1 className="display">Esta área é da equipe.</h1>
        <p className="lede">Sua conta não tem permissão de administrador.</p>
        <Link to="/" className="btn">
          <span>Voltar para a loja</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="container admin__grid">
        <aside className="admin__nav">
          <div>
            <p className="eyebrow">Painel Crossover</p>
            <p className="admin__who">{user.name}</p>
          </div>
          <nav>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {n.label}
              </NavLink>
            ))}
            <Link to="/" className="admin__store">
              Ver loja <IconArrow size={13} />
            </Link>
          </nav>
        </aside>
        <main className="admin__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.admin.stats().then(setStats).catch(() => undefined);
  }, []);

  if (!stats) return <div className="skeleton" style={{ height: 400 }} />;

  const maxMonth = Math.max(...stats.monthly.map((m) => m.revenue), 1);

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1 className="display admin__title">A loja hoje.</h1>
        </div>
        <p className="admin__stamp">Atualizado em tempo real</p>
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <span>Receita total</span>
          <strong>{formatBRL(stats.revenue)}</strong>
          <em>pedidos simulados</em>
        </div>
        <div className="kpi">
          <span>Pedidos</span>
          <strong>{stats.orders}</strong>
          <em>{stats.recent.length} recentes</em>
        </div>
        <div className="kpi">
          <span>Clientes</span>
          <strong>{stats.customers}</strong>
          <em>cadastrados</em>
        </div>
        <div className="kpi">
          <span>Produtos</span>
          <strong>{stats.products}</strong>
          <em>{stats.lowStock} com estoque baixo</em>
        </div>
      </div>

      <div className="admin-two">
        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Receita por mês</h2>
            <span className="admin__hint">últimos 6 meses</span>
          </div>
          <div className="bars">
            {stats.monthly.map((m) => (
              <div key={m.month} className="bars__col">
                <span className="bars__val">{formatBRL(m.revenue).replace('R$ ', '')}</span>
                <div className="bars__bar" style={{ height: `${Math.max(4, (m.revenue / maxMonth) * 100)}%` }} />
                <span className="bars__label">{m.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Vendas por categoria</h2>
          </div>
          <div className="cat-bars">
            {stats.byCategory.slice(0, 6).map((c) => (
              <div key={c.name} className="cat-bars__row">
                <span>{c.name}</span>
                <div className="cat-bars__track">
                  <i style={{ width: `${(c.revenue / Math.max(...stats.byCategory.map((x) => x.revenue), 1)) * 100}%` }} />
                </div>
                <b>{formatBRL(c.revenue)}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-two">
        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Mais vendidos</h2>
          </div>
          <ol className="top-list">
            {stats.topProducts.slice(0, 6).map((p, i) => (
              <li key={p.id}>
                <span className="top-list__rank">{String(i + 1).padStart(2, '0')}</span>
                <span className="top-list__name">{p.name}</span>
                <b>{p.sold} un.</b>
                <em>{formatBRL(p.revenue)}</em>
              </li>
            ))}
          </ol>
        </section>

        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Pedidos recentes</h2>
            <Link to="/admin/pedidos" className="link-underline">
              Ver todos <IconArrow size={12} />
            </Link>
          </div>
          <div className="mini-orders">
            {stats.recent.slice(0, 6).map((o) => (
              <div key={o.id} className="mini-order">
                <span className="mini-order__id">{o.id}</span>
                <span className="mini-order__name">{o.customerName}</span>
                <span className={`status status--${o.status}`}>{ORDER_STATUS[o.status]?.label || o.status}</span>
                <b>{formatBRL(o.total)}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      {stats.pendingReviews > 0 && (
        <div className="admin-alert">
          <p>
            <strong>{stats.pendingReviews}</strong> {stats.pendingReviews === 1 ? 'avaliação aguardando' : 'avaliações aguardando'} moderação.
          </p>
          <Link to="/admin/avaliacoes" className="link-underline">
            Moderar agora <IconArrow size={12} />
          </Link>
        </div>
      )}
    </>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const { notify } = useToast();

  const load = () => api.admin.orders().then(setOrders).catch(() => setOrders([]));
  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, status: string) => {
    await api.admin.updateOrder(id, { status });
    notify({ tone: 'success', title: 'Pedido atualizado', message: `${id} → ${ORDER_STATUS[status]?.label || status}` });
    load();
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="eyebrow">Operação</p>
          <h1 className="display admin__title">Pedidos</h1>
        </div>
        <p className="admin__stamp">{orders?.length ?? '—'} pedidos</p>
      </header>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Pagamento</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.id}</td>
                <td>
                  <strong>{o.customerName}</strong>
                  <em>{o.customerEmail}</em>
                </td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{o.paymentMethod === 'pix' ? 'Pix' : o.paymentMethod === 'boleto' ? 'Boleto' : 'Cartão'}</td>
                <td className="mono">{formatBRL(o.total)}</td>
                <td>
                  <select value={o.status} onChange={(e) => update(o.id, e.target.value)} className={`status-select status--${o.status}`}>
                    {Object.entries(ORDER_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const BLANK_PRODUCT = {
  name: '',
  slug: '',
  category: 'figurinos',
  collection: '',
  price: 0,
  comparePrice: null as number | null,
  shortDescription: '',
  stock: 0,
  images: ['/img/products/prod-1.jpg'],
  sizes: ['P', 'M', 'G'],
  featured: false,
};

export function AdminProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const { notify } = useToast();

  const load = () => api.admin.products().then(setProducts).catch(() => setProducts([]));
  useEffect(() => {
    load();
    api.categories().then(setCategories).catch(() => undefined);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      if (editing.id) await api.admin.updateProduct(editing.id, editing);
      else await api.admin.createProduct(editing);
      notify({ tone: 'success', title: 'Produto salvo' });
      setEditing(null);
      load();
    } catch (err) {
      notify({ tone: 'error', title: 'Erro', message: (err as Error).message });
    }
  };

  const remove = async (id: string) => {
    await api.admin.deleteProduct(id);
    notify({ tone: 'info', title: 'Produto removido' });
    load();
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="display admin__title">Produtos</h1>
        </div>
        <button className="btn btn--sm" onClick={() => setEditing({ ...BLANK_PRODUCT })}>
          <span>
            <IconPlus size={14} /> Novo produto
          </span>
        </button>
      </header>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="prod-cell">
                    <img src={p.images[0]} alt="" />
                    <div>
                      <strong>{p.name}</strong>
                      <em className="mono">{p.id}</em>
                    </div>
                  </div>
                </td>
                <td>{categories.find((c) => c.slug === p.category)?.name || p.category}</td>
                <td className="mono">{formatBRL(p.price)}</td>
                <td>
                  <span className={p.stock <= 5 ? 'stock-low' : ''}>{p.stock} un.</span>
                </td>
                <td className="row-actions">
                  <button onClick={() => setEditing(p)}>Editar</button>
                  <button onClick={() => remove(p.id)} aria-label="Excluir">
                    <IconTrash size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="admin-modal">
          <form className="admin-modal__box" onSubmit={save}>
            <div className="admin-card__head">
              <h2>{editing.id ? 'Editar produto' : 'Novo produto'}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Fechar">
                <IconClose size={16} />
              </button>
            </div>
            <div className="form-grid">
              <div className="field span-2">
                <label>Nome</label>
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Slug</label>
                <input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} required />
              </div>
              <div className="field">
                <label>Categoria</label>
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Preço (R$)</label>
                <input type="number" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>Preço comparativo</label>
                <input type="number" step="0.01" value={editing.comparePrice ?? ''} onChange={(e) => setEditing({ ...editing, comparePrice: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="field">
                <label>Estoque</label>
                <input type="number" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>Coleção</label>
                <input value={editing.collection || ''} onChange={(e) => setEditing({ ...editing, collection: e.target.value })} />
              </div>
              <div className="field span-2">
                <label>Descrição curta</label>
                <input value={editing.shortDescription || ''} onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })} />
              </div>
              <div className="field span-2">
                <label>Imagem principal (caminho)</label>
                <input value={editing.images?.[0] || ''} onChange={(e) => setEditing({ ...editing, images: [e.target.value] })} />
              </div>
              <label className="check-line">
                <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                Destacar na home
              </label>
            </div>
            <div className="admin-modal__actions">
              <button type="button" className="co-back" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn btn--sm">
                <span>Salvar produto</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const { notify } = useToast();

  const load = () => api.admin.reviews().then(setReviews).catch(() => setReviews([]));
  useEffect(() => {
    load();
  }, []);

  const moderate = async (id: number, status: 'approved' | 'rejected') => {
    await api.admin.moderateReview(id, status);
    notify({ tone: 'success', title: status === 'approved' ? 'Avaliação aprovada' : 'Avaliação rejeitada' });
    load();
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="eyebrow">Moderação</p>
          <h1 className="display admin__title">Avaliações</h1>
        </div>
        <p className="admin__stamp">{reviews?.filter((r) => r.status === 'pending').length ?? 0} pendentes</p>
      </header>
      <div className="review-admin-list">
        {reviews?.map((r) => (
          <article key={r.id} className={`review-admin ${r.status === 'pending' ? 'is-pending' : ''}`}>
            <div className="review-admin__head">
              <div>
                <strong>{r.title || 'Sem título'}</strong>
                <em>
                  {r.author} · {r.productName} · {formatDate(r.createdAt)}
                </em>
              </div>
              <span className="review-admin__stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            <p>{r.body}</p>
            <div className="review-admin__actions">
              <span className={`status status--${r.status === 'approved' ? 'pago' : r.status === 'rejected' ? 'cancelado' : 'producao'}`}>
                {r.status === 'approved' ? 'Aprovada' : r.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
              </span>
              <div>
                <button onClick={() => moderate(r.id, 'approved')}>Aprovar</button>
                <button onClick={() => moderate(r.id, 'rejected')}>Rejeitar</button>
              </div>
            </div>
          </article>
        ))}
        {reviews && reviews.length === 0 && <p className="account-empty">Nenhuma avaliação recebida.</p>}
      </div>
    </>
  );
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<{ id: number; name: string; email: string; phone: string | null; created_at: string; orders: number; spent: number }[] | null>(null);

  useEffect(() => {
    api.admin.customers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="eyebrow">Base</p>
          <h1 className="display admin__title">Clientes</h1>
        </div>
        <p className="admin__stamp">{customers?.length ?? '—'} cadastros</p>
      </header>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Pedidos</th>
              <th>Total gasto</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td className="mono">{c.orders}</td>
                <td className="mono">{formatBRL(c.spent)}</td>
                <td>{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
