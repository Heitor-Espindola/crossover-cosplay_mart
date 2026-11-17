/**
 * Envia o banco local (server/data/crossover.sqlite) para a Turso.
 *
 * Uso:
 *   npm run db:push            → cria as tabelas e envia os dados
 *   npm run db:push -- --wipe  → apaga as tabelas da Turso antes (recria do zero)
 *
 * Precisa de TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no .env (ou no ambiente).
 * O banco local precisa existir: rode `npm run seed` antes, se ele não existir.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL = path.join(__dirname, 'data', 'crossover.sqlite');
const wipe = process.argv.includes('--wipe');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error('\nFaltam variáveis de ambiente. Crie um arquivo .env na raiz com:\n');
  console.error('  TURSO_DATABASE_URL=libsql://seu-banco.turso.io');
  console.error('  TURSO_AUTH_TOKEN=seu-token\n');
  process.exit(1);
}
if (!fs.existsSync(LOCAL)) {
  console.error(`Banco local não encontrado em ${LOCAL}. Rode "npm run seed" primeiro.`);
  process.exit(1);
}

const local = createClient({ url: `file:${LOCAL}` });
const remote = createClient({ url, authToken });

const TABLES = [
  'users',
  'password_resets',
  'categories',
  'products',
  'addresses',
  'orders',
  'order_items',
  'reviews',
  'loadouts',
  'favorites',
];

/** Converte um valor lido do SQLite local para algo aceito pelo driver. */
const toArg = (v) => {
  if (v === undefined) return null;
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Uint8Array) return v;
  return v;
};

async function main() {
  console.log('Lendo o banco local…');

  // 1. esquema
  const schemaRows = await local.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'",
  );
  const indexes = schemaRows.rows.filter((r) => r[0] === 'index');
  const tables = schemaRows.rows.filter((r) => r[0] === 'table' && TABLES.includes(String(r[1])));

  if (wipe) {
    console.log('Apagando tabelas na Turso (--wipe)…');
    for (const t of [...TABLES].reverse()) {
      await remote.execute(`DROP TABLE IF EXISTS ${t}`);
    }
  }

  const statements = [];
  for (const t of tables) statements.push({ sql: String(t[2]), args: [] });
  for (const i of indexes) statements.push({ sql: String(i[2]), args: [] });
  await remote.batch(statements, 'write');
  console.log(`Esquema pronto (${tables.length} tabelas).`);

  // 2. dados
  let total = 0;
  for (const table of TABLES) {
    const res = await local.execute(`SELECT * FROM ${table}`);
    if (!res.rows.length) {
      console.log(`  ${table}: vazio`);
      continue;
    }
    const cols = res.columns;
    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
    // a Turso limita o tamanho de um batch: envia em lotes de 100 linhas
    for (let i = 0; i < res.rows.length; i += 100) {
      const chunk = res.rows.slice(i, i + 100).map((row) => ({ sql, args: row.map(toArg) }));
      await remote.batch(chunk, 'write');
    }
    total += res.rows.length;
    console.log(`  ${table}: ${res.rows.length} linhas`);
  }

  console.log(`\nPronto! ${total} linhas enviadas para ${url}`);
}

main().catch((err) => {
  console.error('\nFalha ao enviar para a Turso:', err.message || err);
  process.exit(1);
});
