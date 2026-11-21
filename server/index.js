import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, parseJson, json, initDb, isRemote } from './db.js';
import { seedIfEmpty } from './seed.js';
import { currentUser, requireAdmin, requireAuth, publicUser, signToken, setAuthCookie, clearAuthCookie } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const app = express();

// Em produção o app e a API vivem no mesmo domínio, então não precisa de CORS.
// ALLOWED_ORIGIN permite liberar um domínio extra (ex.: um preview na Vercel).
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin ? allowedOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use((req, _res, next) => { if (process.env.DEBUG_REQ) console.log('REQ', req.method, req.originalUrl); next(); });

const productRow = (row) =>
  row && {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    collection: row.collection,
    price: row.price,
    comparePrice: row.compare_price,
    shortDescription: row.short_description,
    description: row.description,
    details: row.details,
    specs: parseJson(row.specs, {}),
    images: parseJson(row.images, []),
    sizes: parseJson(row.sizes, ['Único']),
    stock: row.stock,
    rating: row.rating,
    reviewCount: row.review_count,
    featured: !!row.featured,
    badge: row.badge,
  };

const categoryRow = (row) => ({
  slug: row.slug,
  name: row.name,
  tagline: row.tagline,
  description: row.description,
  image: row.image,
  sortOrder: row.sort_order,
  productCount: row.product_count ?? undefined,
});

const orderRow = (row, withItems = true) => ({
  ...(withItems ? {} : {}),
  id: row.id,
  userId: row.user_id,
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  shippingAddress: parseJson(row.shipping_address, {}),
  shippingMethod: row.shipping_method,
  shippingCost: row.shipping_cost,
  paymentMethod: row.payment_method,
  subtotal: row.subtotal,
  discount: row.discount,
  total: row.total,
  status: row.status,
  paymentStatus: row.payment_status,
  note: row.note,
  createdAt: row.created_at,
  items: withItems ? row._items : undefined,
});

/** Busca um pedido já com os itens. */
async function orderWithItems(id) {
  const row = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return null;
  const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return orderRow({
    ...row,
    _items: items.map((i) => ({
      productId: i.product_id,
      name: i.name,
      image: i.image,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })),
  });
}

const reviewRow = (row) => ({
  id: row.id,
  productId: row.product_id,
  author: row.author,
  rating: row.rating,
  title: row.title,
  body: row.body,
  status: row.status,
  createdAt: row.created_at,
});

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
const cepOk = (c) => /^\d{5}-?\d{3}$/.test((c || '').trim());

/* ------------------------------- catálogo ------------------------------- */

app.get('/api/health', async (_req, res) => {
  try {
    await db.prepare('SELECT 1').get();
    res.json({
      ok: true,
      db: 'supabase-postgresql',
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

app.get('/api/categories', async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category = c.slug) AS product_count
       FROM categories c ORDER BY c.sort_order`,
    )
    .all();
  res.json(rows.map(categoryRow));
});

app.get('/api/products', async (req, res) => {
  const { category, collection, q, sort = 'relevance', min, max, featured, limit } = req.query;
  const where = [];
  const params = {};
  if (category && category !== 'todos') {
    where.push('category = @category');
    params.category = category;
  }
  if (collection) {
    where.push('collection = @collection');
    params.collection = collection;
  }
  if (featured === 'true') where.push('featured = 1');
  if (min) {
    where.push('price >= @min');
    params.min = Number(min);
  }
  if (max) {
    where.push('price <= @max');
    params.max = Number(max);
  }
  if (q) {
    where.push('(lower(name) LIKE @q OR lower(short_description) LIKE @q OR lower(collection) LIKE @q OR lower(category) LIKE @q)');
    params.q = `%${String(q).toLowerCase()}%`;
  }
  const order = {
    'price-asc': 'price ASC',
    'price-desc': 'price DESC',
    rating: 'rating DESC, review_count DESC',
    newest: 'created_at DESC, id DESC',
    relevance: 'featured DESC, rating DESC, review_count DESC',
  }[sort] || 'featured DESC, rating DESC, review_count DESC';

  const sql = `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}${limit ? ' LIMIT ' + Number(limit) : ''}`;
  const rows = await db.prepare(sql).all(params);
  res.json(rows.map(productRow));
});

app.get('/api/products/:slug', async (req, res) => {
  const row = (await db.prepare('SELECT * FROM products WHERE slug = ? OR id = ?').get(req.params.slug, req.params.slug));
  if (!row) return res.status(404).json({ error: 'Produto não encontrado.' });
  const product = productRow(row);
  const relatedRows = await db
    .prepare('SELECT * FROM products WHERE category = ? AND id <> ? ORDER BY rating DESC LIMIT 4')
    .all(product.category, product.id);
  const related = relatedRows.map(productRow);
  const reviewRows = await db
    .prepare("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 8")
    .all(product.id);
  const reviews = reviewRows.map(reviewRow);
  res.json({ ...product, related, reviews });
});

app.get('/api/search/suggestions', async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ products: [], categories: [], collections: [] });
  const productRows = await db
    .prepare('SELECT * FROM products WHERE lower(name) LIKE ? OR lower(short_description) LIKE ? LIMIT 6')
    .all(`%${q}%`, `%${q}%`);
  const products = productRows.map(productRow);
  const categoryRows = await db
    .prepare('SELECT * FROM categories WHERE lower(name) LIKE ? LIMIT 3')
    .all(`%${q}%`);
  const categories = categoryRows.map(categoryRow);
  const collectionRows = await db
    .prepare('SELECT DISTINCT collection FROM products WHERE lower(collection) LIKE ? LIMIT 3')
    .all(`%${q}%`);
  const collections = collectionRows.map((r) => r.collection);
  res.json({ products, categories, collections });
});

/* ------------------------------ autenticação ---------------------------- */

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Informe seu nome completo.' });
  if (!emailOk(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'A senha precisa ter ao menos 6 caracteres.' });
  const exists = (await db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email.toLowerCase()));
  if (exists) return res.status(409).json({ error: 'Este e-mail já possui uma conta Crossover.' });
  const hash = bcrypt.hashSync(password, 10);
  const info = (await db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')").run(name.trim(), email.toLowerCase(), hash));
  const user = (await db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid));
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const row = (await db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(String(email || '').toLowerCase()));
  if (!row || !bcrypt.compareSync(String(password || ''), row.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  setAuthCookie(res, signToken(row));
  res.json({ user: publicUser(row) });
});

app.post('/api/auth/logout', async (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  res.json({ user: await currentUser(req) });
});

app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body || {};
  const row = (await db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(String(email || '').toLowerCase()));
  // Sempre responde igual, para não revelar se o e-mail existe.
  const token = crypto.randomBytes(24).toString('hex');
  if (row) {
    (await db.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, row.id, Date.now() + 1000 * 60 * 60));
  }
  res.json({
    ok: true,
    message: 'Se este e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
    demoToken: row ? token : null,
  });
});

app.post('/api/auth/reset', async (req, res) => {
  const { token, password } = req.body || {};
  if (!password || password.length < 6) return res.status(400).json({ error: 'A senha precisa ter ao menos 6 caracteres.' });
  const row = (await db.prepare('SELECT * FROM password_resets WHERE token = ?').get(token));
  if (!row || row.expires_at < Date.now()) return res.status(400).json({ error: 'Link de recuperação inválido ou expirado.' });
  (await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), row.user_id));
  (await db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(row.user_id));
  res.json({ ok: true });
});

/* -------------------------------- conta --------------------------------- */

app.patch('/api/account', requireAuth, async (req, res) => {
  const { name, phone, cpf } = req.body || {};
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Informe seu nome completo.' });
  (await db.prepare('UPDATE users SET name = ?, phone = ?, cpf = ? WHERE id = ?').run(name.trim(), phone || null, cpf || null, req.user.id));
  const row = (await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
  res.json({ user: publicUser(row) });
});

const addressRow = (r) => ({
  id: r.id,
  label: r.label,
  recipient: r.recipient,
  cep: r.cep,
  street: r.street,
  number: r.number,
  complement: r.complement,
  district: r.district,
  city: r.city,
  state: r.state,
  isDefault: !!r.is_default,
});

app.get('/api/account/addresses', requireAuth, async (req, res) => {
  const rows = await db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id').all(req.user.id);
  res.json(rows.map(addressRow));
});

app.post('/api/account/addresses', requireAuth, async (req, res) => {
  const a = req.body || {};
  if (!a.cep || !cepOk(a.cep)) return res.status(400).json({ error: 'CEP inválido.' });
  if (!a.street || !a.number || !a.city || !a.state) return res.status(400).json({ error: 'Preencha endereço, número, cidade e estado.' });
  const count = (await db.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').get(req.user.id)).n;
  const info = await db
    .prepare(
      `INSERT INTO addresses (user_id, label, recipient, cep, street, number, complement, district, city, state, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(req.user.id, a.label || 'Endereço', a.recipient || req.user.name, a.cep, a.street, a.number, a.complement || '', a.district || '', a.city, a.state, count === 0 ? 1 : 0);
  res.status(201).json(addressRow((await db.prepare('SELECT * FROM addresses WHERE id = ?').get(info.lastInsertRowid))));
});

app.put('/api/account/addresses/:id', requireAuth, async (req, res) => {
  const a = req.body || {};
  const existing = (await db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id));
  if (!existing) return res.status(404).json({ error: 'Endereço não encontrado.' });
  if (a.cep && !cepOk(a.cep)) return res.status(400).json({ error: 'CEP inválido.' });
  await db.prepare(
    `UPDATE addresses SET label = ?, cep = ?, street = ?, number = ?, complement = ?, district = ?, city = ?, state = ? WHERE id = ? AND user_id = ?`,
  ).run(
    a.label ?? existing.label,
    a.cep ?? existing.cep,
    a.street ?? existing.street,
    a.number ?? existing.number,
    a.complement ?? existing.complement,
    a.district ?? existing.district,
    a.city ?? existing.city,
    a.state ?? existing.state,
    req.params.id,
    req.user.id,
  );
  if (a.isDefault) {
    (await db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id));
    (await db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id));
  }
  res.json(addressRow((await db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id))));
});

app.post('/api/account/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ error: 'A nova senha precisa ter ao menos 6 caracteres.' });
  const row = (await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
  if (!bcrypt.compareSync(currentPassword || '', row.password_hash)) return res.status(400).json({ error: 'Senha atual incorreta.' });
  (await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id));
  res.json({ ok: true });
});

app.delete('/api/account/addresses/:id', requireAuth, async (req, res) => {
  (await db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id));
  res.json({ ok: true });
});

app.post('/api/account/addresses/:id/default', requireAuth, async (req, res) => {
  (await db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id));
  (await db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id));
  res.json({ ok: true });
});

/* ------------------------------ favoritos ------------------------------- */

app.get('/api/favorites', requireAuth, async (req, res) => {
  const rows = await db
    .prepare('SELECT p.* FROM favorites f JOIN products p ON p.id = f.product_id WHERE f.user_id = ? ORDER BY f.created_at DESC')
    .all(req.user.id);
  res.json(rows.map(productRow));
});

app.post('/api/favorites/:productId', requireAuth, async (req, res) => {
  const exists = (await db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, req.params.productId));
  if (exists) {
    await db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  } else {
    await db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.user.id, req.params.productId);
  }
  res.json({ favorited: !exists });
});

/* ------------------------------- loadouts ------------------------------- */

const loadoutRow = (r) => ({ id: r.id, name: r.name, items: parseJson(r.items, []), createdAt: r.created_at });

app.get('/api/loadouts', requireAuth, async (req, res) => {
  const rows = await db.prepare('SELECT * FROM loadouts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(loadoutRow));
});

app.post('/api/loadouts', requireAuth, async (req, res) => {
  const { name, items } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Dê um nome ao seu loadout.' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Adicione ao menos uma peça ao loadout.' });
  const info = (await db.prepare('INSERT INTO loadouts (user_id, name, items) VALUES (?, ?, ?)').run(req.user.id, name.trim(), json(items)));
  res.status(201).json(loadoutRow((await db.prepare('SELECT * FROM loadouts WHERE id = ?').get(info.lastInsertRowid))));
});

app.delete('/api/loadouts/:id', requireAuth, async (req, res) => {
  await db.prepare('DELETE FROM loadouts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

/* -------------------------------- frete --------------------------------- */

const CEP_TABLE = {
  '01': 'SP', '02': 'SP', '03': 'SP', '04': 'SP', '05': 'SP', '06': 'SP', '07': 'SP', '08': 'SP',
  '20': 'RJ', '21': 'RJ', '22': 'RJ', '23': 'RJ', '24': 'RJ', '25': 'RJ', '26': 'RJ', '27': 'RJ', '28': 'RJ',
  '30': 'MG', '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '36': 'MG', '37': 'MG', '38': 'MG', '39': 'MG',
  '40': 'BA', '41': 'BA', '42': 'BA', '43': 'BA', '44': 'BA', '45': 'BA', '46': 'BA', '47': 'BA', '48': 'BA',
  '49': 'SE', '50': 'PE', '51': 'PE', '52': 'PE', '53': 'PE', '54': 'PE', '55': 'PE', '56': 'PE', '57': 'AL', '58': 'PB', '59': 'RN',
  '60': 'CE', '61': 'CE', '62': 'CE', '63': 'CE', '64': 'PI', '65': 'MA', '66': 'PA', '67': 'PA', '68': 'PA', '69': 'AM',
  '70': 'DF', '71': 'DF', '72': 'DF', '73': 'DF', '74': 'GO', '75': 'GO', '76': 'GO', '77': 'TO', '78': 'MT', '79': 'MS',
  '80': 'PR', '81': 'PR', '82': 'PR', '83': 'PR', '84': 'PR', '85': 'PR', '86': 'PR', '87': 'PR',
  '88': 'SC', '89': 'SC', '90': 'RS', '91': 'RS', '92': 'RS', '93': 'RS', '94': 'RS', '95': 'RS', '96': 'RS', '97': 'RS', '98': 'RS', '99': 'RS',
};

const CITIES = {
  '01310-200': { street: 'Avenida Paulista', district: 'Bela Vista', city: 'São Paulo', state: 'SP' },
  '20040-020': { street: 'Avenida Rio Branco', district: 'Centro', city: 'Rio de Janeiro', state: 'RJ' },
  '30130-010': { street: 'Avenida Afonso Pena', district: 'Centro', city: 'Belo Horizonte', state: 'MG' },
  '80020-310': { street: 'Rua XV de Novembro', district: 'Centro', city: 'Curitiba', state: 'PR' },
  '90010-150': { street: 'Rua dos Andradas', district: 'Centro Histórico', city: 'Porto Alegre', state: 'RS' },
  '70040-010': { street: 'Esplanada dos Ministérios', district: 'Zona Cívico-Administrativa', city: 'Brasília', state: 'DF' },
  '40015-970': { street: 'Avenida Sete de Setembro', district: 'Centro', city: 'Salvador', state: 'BA' },
  '50030-230': { street: 'Avenida Marquês de Olinda', district: 'Recife Antigo', city: 'Recife', state: 'PE' },
  '05424-020': { street: 'Rua dos Pinheiros', district: 'Pinheiros', city: 'São Paulo', state: 'SP' },
};

app.get('/api/shipping/:cep', async (req, res) => {
  const raw = String(req.params.cep || '').replace(/\D/g, '');
  if (raw.length !== 8) return res.status(400).json({ error: 'CEP inválido. Use o formato 00000-000.' });
  const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
  const known = CITIES[formatted];
  const state = known?.state || CEP_TABLE[raw.slice(0, 2)] || 'SP';
  const city = known?.city || null;
  const local = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'].includes(state);
  const options = [
    { id: 'pac', name: 'Entrega padrão', carrier: 'Crossover Correios', eta: local ? '5 a 8 dias úteis' : '8 a 14 dias úteis', price: local ? 19.9 : 34.9 },
    { id: 'sedex', name: 'Entrega expressa', carrier: 'Crossover Express', eta: local ? '2 a 4 dias úteis' : '4 a 7 dias úteis', price: local ? 34.9 : 54.9 },
    { id: 'retirada', name: 'Retirada em mãos', carrier: 'São Paulo — Pinheiros', eta: 'a partir de 2 dias úteis', price: 0 },
  ];
  res.json({ cep: formatted, state, city, street: known?.street || '', district: known?.district || '', options });
});

/* -------------------------------- pedidos ------------------------------- */

const STATUSES = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'];

app.post('/api/orders', async (req, res) => {
  const user = await currentUser(req);
  const b = req.body || {};
  const items = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0) return res.status(400).json({ error: 'Seu carrinho está vazio.' });
  if (!b.customer?.name || !emailOk(b.customer?.email)) return res.status(400).json({ error: 'Informe nome e e-mail válidos.' });
  if (!b.shippingAddress?.cep || !cepOk(b.shippingAddress.cep)) return res.status(400).json({ error: 'Informe um CEP válido.' });
  if (!['credit_card', 'boleto', 'pix'].includes(b.paymentMethod)) return res.status(400).json({ error: 'Selecione uma forma de pagamento.' });

  const lines = [];
  for (const i of items) {
    const p = await db.prepare('SELECT * FROM products WHERE id = ?').get(i.productId);
    if (p) lines.push({ product: p, size: i.size || 'Único', quantity: Math.max(1, Number(i.quantity) || 1) });
  }
  if (lines.length === 0) return res.status(400).json({ error: 'Nenhum produto válido no pedido.' });

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
  const shippingCost = Number(b.shippingCost) || 0;
  const total = Math.round((subtotal + shippingCost) * 100) / 100;
  const id = `CX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  await db.transaction(async (tx) => {
    await tx.prepare(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, shipping_address, shipping_method,
        shipping_cost, payment_method, subtotal, total, status, payment_status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'simulated_pending', ?)`,
    ).run(id, user?.id || null, b.customer.name, b.customer.email, b.customer.phone || '', json(b.shippingAddress), b.shippingMethod || 'PAC', shippingCost, b.paymentMethod, subtotal, total, b.note || '');
    const insItem = tx.prepare(
      'INSERT INTO order_items (order_id, product_id, name, image, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (const l of lines) {
      await insItem.run(id, l.product.id, l.product.name, parseJson(l.product.images, [])[0], l.size, l.quantity, l.product.price);
      await tx.prepare('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',).run(l.quantity, l.product.id);
    }
  });
  res.status(201).json(await orderWithItems(id));
});

app.get('/api/orders', requireAuth, async (req, res) => {
  const rows = (await db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
  const withItems = [];
  for (const r of rows) withItems.push(await orderWithItems(r.id));
  res.json(withItems);
});

app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const row = (await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
  if (!row) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (row.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  res.json(await orderWithItems(row.id));
});

/* ------------------------------ avaliações ------------------------------ */

app.post('/api/products/:id/reviews', async (req, res) => {
  const user = await currentUser(req);
  const { rating, title, body, author } = req.body || {};
  const r = Number(rating);
  if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'Escolha uma nota de 1 a 5 estrelas.' });
  if (!body || body.trim().length < 10) return res.status(400).json({ error: 'Escreva ao menos 10 caracteres na sua avaliação.' });
  const product = (await db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  const name = user?.name || (author || '').trim() || 'Cliente Crossover';
  await db.prepare(
    "INSERT INTO reviews (product_id, user_id, author, rating, title, body, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
  ).run(product.id, user?.id || null, name, r, (title || '').trim(), body.trim());
  res.status(201).json({ ok: true, message: 'Obrigado! Sua avaliação será publicada após a curadoria da equipe.' });
});

/* --------------------------------- admin -------------------------------- */

app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  const revenue = (await db.prepare("SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE status <> 'cancelled'").get()).v;
  const orders = (await db.prepare('SELECT COUNT(*) AS n FROM orders').get()).n;
  const customers = (await db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'").get()).n;
  const productsCount = (await db.prepare('SELECT COUNT(*) AS n FROM products').get()).n;
  const lowStock = (await db.prepare('SELECT COUNT(*) AS n FROM products WHERE stock <= 5').get()).n;
  const pendingReviews = (await db.prepare("SELECT COUNT(*) AS n FROM reviews WHERE status = 'pending'").get()).n;
  const byCategory = await db
    .prepare(
      `SELECT c.name, COUNT(p.id) AS products, COALESCE(SUM(oi.quantity * oi.unit_price),0) AS revenue
       FROM categories c
       LEFT JOIN products p ON p.category = c.slug
       LEFT JOIN order_items oi ON oi.product_id = p.id
       GROUP BY c.slug ORDER BY c.sort_order`,
    )
    .all();
  const recentRows = await db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6').all();
  const recent = recentRows.map((r) => orderRow(r, false));
  const topProducts = await db
    .prepare(
      `SELECT p.name, p.id, SUM(oi.quantity) AS sold, SUM(oi.quantity * oi.unit_price) AS revenue
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       GROUP BY p.id ORDER BY sold DESC LIMIT 5`,
    )
    .all();
  const monthly = await db
    .prepare(`SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS orders, SUM(total) AS revenue FROM orders GROUP BY month ORDER BY month DESC LIMIT 6`)
    .all();
  monthly.reverse();
  res.json({ revenue, orders, customers, products: productsCount, lowStock, pendingReviews, byCategory, recent, topProducts, monthly });
});

app.get('/api/admin/products', requireAdmin, async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM products ORDER BY category, name').all();
  res.json(rows.map(productRow));
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.category || !(Number(b.price) > 0)) return res.status(400).json({ error: 'Nome, categoria e preço são obrigatórios.' });
  const id = b.id || `crossover-${Date.now()}`;
  const slug = (b.slug || b.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  await db.prepare(
    `INSERT INTO products (id, slug, name, category, collection, price, compare_price, short_description, description, details, specs, images, sizes, stock, rating, review_count, featured, badge)
     VALUES (@id, @slug, @name, @category, @collection, @price, @comparePrice, @shortDescription, @description, @details, @specs, @images, @sizes, @stock, @rating, @reviewCount, @featured, @badge)`,
  ).run({
    id,
    slug,
    name: b.name,
    category: b.category,
    collection: b.collection || 'Novidades',
    price: Number(b.price),
    comparePrice: b.comparePrice ? Number(b.comparePrice) : null,
    shortDescription: b.shortDescription || '',
    description: b.description || '',
    details: b.details || '',
    specs: json(b.specs || {}),
    images: json(b.images?.length ? b.images : ['/img/studio/atelier-wardrobe.jpg']),
    sizes: json(b.sizes?.length ? b.sizes : ['Único']),
    stock: Number(b.stock) || 0,
    rating: 0,
    reviewCount: 0,
    featured: b.featured ? 1 : 0,
    badge: b.badge || null,
  });
  res.status(201).json(productRow((await db.prepare('SELECT * FROM products WHERE id = ?').get(id))));
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const b = req.body || {};
  const current = (await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
  if (!current) return res.status(404).json({ error: 'Produto não encontrado.' });
  await db.prepare(
    `UPDATE products SET name=@name, category=@category, collection=@collection, price=@price, compare_price=@comparePrice,
     short_description=@shortDescription, description=@description, details=@details, specs=@specs, images=@images,
     sizes=@sizes, stock=@stock, featured=@featured, badge=@badge WHERE id=@id`,
  ).run({
    id: current.id,
    name: b.name ?? current.name,
    category: b.category ?? current.category,
    collection: b.collection ?? current.collection,
    price: b.price !== undefined ? Number(b.price) : current.price,
    comparePrice: b.comparePrice !== undefined ? (b.comparePrice ? Number(b.comparePrice) : null) : current.compare_price,
    shortDescription: b.shortDescription ?? current.short_description,
    description: b.description ?? current.description,
    details: b.details ?? current.details,
    specs: json(b.specs ?? parseJson(current.specs, {})),
    images: json(b.images ?? parseJson(current.images, [])),
    sizes: json(b.sizes ?? parseJson(current.sizes, ['Único'])),
    stock: b.stock !== undefined ? Number(b.stock) : current.stock,
    featured: b.featured !== undefined ? (b.featured ? 1 : 0) : current.featured,
    badge: b.badge !== undefined ? b.badge || null : current.badge,
  });
  res.json(productRow((await db.prepare('SELECT * FROM products WHERE id = ?').get(current.id))));
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  (await db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id));
  res.json({ ok: true });
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  const { slug, name, tagline, description, image } = req.body || {};
  if (!slug || !name) return res.status(400).json({ error: 'Slug e nome são obrigatórios.' });
  const total = (await db.prepare('SELECT COUNT(*) AS n FROM categories').get()).n;
  await db.prepare(`
    INSERT INTO categories
      (slug, name, tagline, description, image, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      tagline = EXCLUDED.tagline,
      description = EXCLUDED.description,
      image = EXCLUDED.image,
      sort_order = EXCLUDED.sort_order
  `).run(
    slug,
    name,
    tagline || '',
    description || '',
    image || '/img/studio/editorial-rack.jpg',
    total + 1,
  );
  res.status(201).json({ ok: true });
});

app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const list = [];
  for (const r of rows) list.push(await orderWithItems(r.id));
  res.json(list);
});

app.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  const { status, paymentStatus } = req.body || {};
  const row = (await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
  if (!row) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido.' });
  await db.prepare('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?').run(
    status || row.status,
    paymentStatus || row.payment_status,
    row.id,
  );
  res.json(await orderWithItems(row.id));
});

app.get('/api/admin/customers', requireAdmin, async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, COUNT(o.id) AS orders, COALESCE(SUM(o.total),0) AS spent
       FROM users u LEFT JOIN orders o ON o.user_id = u.id AND o.status <> 'cancelled'
       WHERE u.role = 'customer' GROUP BY u.id ORDER BY u.created_at DESC`,
    )
    .all();
  res.json(rows);
});

app.get('/api/admin/reviews', requireAdmin, async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT r.*, p.name AS product_name FROM reviews r JOIN products p ON p.id = r.product_id
       ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC`,
    )
    .all();
  res.json(rows.map((r) => ({ ...reviewRow(r), productName: r.product_name })));
});

app.patch('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Status inválido.' });
  const row = (await db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id));
  if (!row) return res.status(404).json({ error: 'Avaliação não encontrada.' });
  (await db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, row.id));
  if (status === 'approved') {
    const agg = (await db.prepare("SELECT AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE product_id = ? AND status = 'approved'").get(row.product_id));
    (await db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(Math.round(agg.avg * 10) / 10, agg.n, row.product_id));
  }
  res.json({ ok: true });
});

/* ------------------------------- estáticos ------------------------------ */

const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  const indexHtml = path.join(dist, 'index.html');
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.method !== 'GET') return next();
    return res.sendFile('index.html', { root: dist }, (err) => {
      if (err) next(err);
    });
  });
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

initDb()
  .then(() => seedIfEmpty())
  .then((seeded) => {
    if (seeded) console.log('Catálogo de demonstração inserido.');
    app.listen(PORT, () => {
      console.log(`Crossover ouvindo em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao iniciar o banco:', err);
    process.exit(1);
  });
