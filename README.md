# Crossover Cosplay Mart

Marketplace de cosplay, games, quadrinhos, mangá/anime e RPG.
React + Vite no front, Node/Express na API, SQLite via **Turso** no banco.
Pronto para o **Railway**.

**📘 Tudo explicado em [GUIA.md](./GUIA.md)** — como criar e editar produtos,
configurar a Turso, publicar no Railway e o que é simulado no checkout.

## Rodar local

```bash
npm install
npm run seed     # cria o banco local com 48 produtos
npm run build
npm start        # http://localhost:4000
```

Desenvolvimento (dois terminais):

```bash
npm run dev            # site em http://localhost:5173
node server/index.js   # API em http://localhost:4000
```

## Contas de demonstração

- Cliente: `marina@crossover.com.br` / `crossover123`
- Admin: `admin@crossover.com.br` / `admin123`

## Deploy

1. `npm run db:push` com `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no `.env`.
2. Railway → Deploy from GitHub → variáveis `TURSO_DATABASE_URL`,
   `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `NODE_ENV=production`.
3. Confira `https://seu-dominio/api/health` → `{"ok":true,"db":"turso"}`.

Configuração de build em `railway.json` e `nixpacks.toml`.
