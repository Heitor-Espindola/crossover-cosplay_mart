import { createClient } from "@libsql/client";
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Banco de dados.
 *
 * Em produção (Railway) usamos a Turso: basta definir TURSO_DATABASE_URL e
 * TURSO_AUTH_TOKEN. Sem essas variáveis o app usa um arquivo SQLite local em
 * server/data/crossover.sqlite — o mesmo formato, então dá para desenvolver
 * offline e enviar os dados para a Turso depois (npm run db:push).
 */
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const isRemote = Boolean(remoteUrl);

const client = createClient(
  remoteUrl
    ? { url: remoteUrl, authToken }
    : { url: `file:${path.join(DATA_DIR, 'crossover.sqlite')}` },
);

/** SQL de migração — roda uma vez a cada boot, é idempotente. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    phone TEXT,
    cpf TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    image TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES categories(slug),
    collection TEXT,
    price REAL NOT NULL,
    compare_price REAL,
    short_description TEXT,
    description TEXT,
    details TEXT,
    specs TEXT,
    images TEXT,
    sizes TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    featured INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT,
    recipient TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    district TEXT,
    city TEXT,
    state TEXT,
    is_default INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    shipping_method TEXT,
    shipping_cost REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'simulated_pending',
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    size TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS loadouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    items TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, product_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
  `CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`,
];

let ready = null;

/** Cria as tabelas (uma única vez por processo). */
export function initDb() {
  if (!ready) {
    ready = (async () => {
      for (const sql of SCHEMA) await client.execute(sql);
      return client;
    })();
  }
  return ready;
}

/* ------------------------------------------------------------------------ */
/*  Pequeno adaptador com a mesma "cara" do better-sqlite3 usado antes:      */
/*    const st = db.prepare(sql)  →  st.all(params) / st.get(params) /       */
/*                                   st.run(params)                          */
/*  A diferença é que tudo agora é assíncrono (await), porque a Turso é HTTP.*/
/* ------------------------------------------------------------------------ */

// undefined vira NULL e objetos viram JSON — como o better-sqlite3 fazia
const cleanArgs = (list) =>
  list.map((v) => {
    if (v === undefined) return null;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Uint8Array)) return JSON.stringify(v);
    if (Array.isArray(v)) return JSON.stringify(v);
    return v;
  });

const toNamed = (sql, params, extra) => {
  // st.run(a, b, c) — posicional, como no better-sqlite3
  if (extra !== undefined) return { sql, args: cleanArgs([params, ...extra]) };
  if (Array.isArray(params)) return { sql, args: cleanArgs(params) };
  if (params && typeof params === 'object' && !(params instanceof Uint8Array)) {
    const args = {};
    const clean = sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, key) => {
      args[key] = params[key] === undefined ? null : params[key];
      return `:${key}`;
    });
    return { sql: clean, args };
  }
  if (params !== null && typeof params === 'object' && !(params instanceof Uint8Array)) {
    // objeto de parâmetros posicionais? não existe: trata como named
    return { sql, args: params };
  }
  return { sql, args: params === undefined ? [] : cleanArgs([params]) };
};

const normalize = (value) => {
  if (typeof value === 'bigint') return Number(value);
  if (value === null || value === undefined) return value;
  return value;
};

const rowToObject = (row, columns) => {
  const out = {};
  columns.forEach((c, i) => {
    out[c] = normalize(row[i]);
  });
  return out;
};

export function prepare(sql) {
  return {
    async all(params, ...rest) {
      const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
      const res = await client.execute({ sql: q, args });
      return res.rows.map((r) => rowToObject(r, res.columns));
    },
    async get(params, ...rest) {
      const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
      const res = await client.execute({ sql: q, args });
      return res.rows.length ? rowToObject(res.rows[0], res.columns) : undefined;
    },
    async run(params, ...rest) {
      const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
      // "INSERT OR REPLACE" não devolve lastInsertRowid no libSQL: pegamos o
      // último id da conexão (funciona igual no arquivo local e na Turso).
      const res = await client.execute({ sql: q, args });
      let lastId = normalize(res.lastInsertRowid);
      if (lastId === null || lastId === undefined) {
        const r = await client.execute('SELECT last_insert_rowid() AS id');
        lastId = normalize(r.rows[0]?.[0]);
      }
      return { changes: res.rowsAffected, lastInsertRowid: lastId };
    },
  };
}

/** Executa várias instruções sem parâmetros (migrações, limpeza). */
export async function exec(sql) {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const s of statements) await client.execute(s);
}

/**
 * Transação. Usamos a API de transação interativa do libSQL, que funciona
 * igual no arquivo local e na Turso (HTTP).
 */
let lastTxIds = [];
export const lastIds = () => lastTxIds;

export async function transaction(fn, onIds) {
  const statements = [];
  const queue = {
    prepare: (sql) => ({
      async all(params, ...rest) {
        const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
        statements.push({ sql: q, args });
        return [];
      },
      async get(params, ...rest) {
        const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
        statements.push({ sql: q, args });
        return undefined;
      },
      async run(params, ...rest) {
        const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
        statements.push({ sql: q, args });
        return { changes: 0, lastInsertRowid: undefined };
      },
    }),
  };
  await fn(queue);
  if (statements.length === 0) return;

  // batch = atômico (BEGIN/COMMIT numa só viagem) e muito mais rápido.
  // `onResult` permite capturar ids de INSERTs anteriores (ver seed.js).
  const results = await client.batch(statements, 'write');
  results.forEach((r, i) => {
    if (onIds) onIds(i, normalize(r.lastInsertRowid));
  });
  return results.length;
}

function txPrepare(tx, sql) {
  return {
    async all(params, ...rest) {
      const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
      const res = await tx.execute({ sql: q, args });
      return res.rows.map((r) => rowToObject(r, res.columns));
    },
    async get(params, ...rest) {
      const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
      const res = await tx.execute({ sql: q, args });
      return res.rows.length ? rowToObject(res.rows[0], res.columns) : undefined;
    },
    async run(params, ...rest) {
      const { sql: q, args } = toNamed(sql, params, rest[0] === undefined ? undefined : rest);
      const res = await tx.execute({ sql: q, args });
      return { changes: res.rowsAffected, lastInsertRowid: normalize(res.lastInsertRowid) };
    },
  };
}

export const db = { prepare, exec, transaction };

/* ------------------------------- helpers -------------------------------- */

export function json(value) {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

export function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
