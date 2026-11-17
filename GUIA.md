# Crossover Cosplay Mart — guia do projeto

Loja (marketplace) de cosplay, games, quadrinhos, mangá/anime e RPG.
Front em **React + Vite**, API em **Node + Express** e banco **SQLite via Turso**
(compatível com SQLite; roda local em arquivo e em produção na nuvem).

```
webcrossover/
├─ src/                 → site (React + TypeScript)
│  ├─ pages/            → uma pasta de estilos por página
│  ├─ components/       → Header, Footer, Carrinho, Carrossel, Splash…
│  ├─ context/          → estado global (carrinho, sessão, favoritos)
│  └─ styles/           → tokens de cor, tipografia, cursor
├─ public/img/          → todas as imagens (produtos, editoriais, pessoas)
├─ server/
│  ├─ db.js             → conexão com a Turso/SQLite + criação das tabelas
│  ├─ index.js          → API REST + serve o site compilado
│  ├─ auth.js           → login, cookies e permissões
│  ├─ seed-data.js      → ⭐ ONDE FICAM OS PRODUTOS E CATEGORIAS
│  ├─ seed.js           → popula o banco com seed-data.js
│  ├─ push-turso.js     → envia o banco local para a Turso
│  └─ data/             → banco SQLite local (fora do Git)
├─ railway.json         → configuração de deploy no Railway
├─ nixpacks.toml        → build usado pelo Railway
└─ .env.example         → modelo das variáveis de ambiente
```

---

## 1. Rodando na sua máquina

```bash
npm install          # instala tudo
npm run seed         # cria o banco local e insere os 48 produtos
npm run build        # compila o site
npm start            # sobe em http://localhost:4000
```

Durante o desenvolvimento, use dois terminais:

```bash
npm run dev          # site com recarregamento em http://localhost:5173
node server/index.js # API em http://localhost:4000
```

Contas de demonstração:

| Perfil   | E-mail                     | Senha          |
|----------|----------------------------|----------------|
| Cliente  | `marina@crossover.com.br`  | `crossover123` |
| Admin    | `admin@crossover.com.br`   | `admin123`     |

> Troque essas senhas antes de abrir a loja para o público (veja §6).

---

## 2. Como criar e editar produtos

Você tem **dois caminhos**. Os dois gravam no mesmo lugar (o banco), então
pode usar o painel no dia a dia e o arquivo de dados quando quiser subir
um lote grande de uma vez.

### 2.1 Pelo painel administrativo (recomendado)

1. Entre em `/entrar` com a conta **admin**.
2. Vá para `/admin` → aba **Produtos**.
3. **Novo produto**: preencha nome, categoria, preço, estoque e descrições.
4. **Editar**: clique no produto na lista, altere e salve.
5. **Apagar**: o botão de excluir remove o produto do catálogo.

O painel também permite:

- **Pedidos** — mudar o status (pendente → pago → enviado → entregue) e o
  status do pagamento. O pagamento é simulado (ver §7).
- **Avaliações** — aprovar ou recusar comentários antes de aparecerem na loja.
- **Categorias** — criar novas categorias (slug + nome).
- **Clientes** — ver quem comprou, quantos pedidos e quanto gastou.

> **Imagens:** o painel ainda **não faz upload de arquivo**. Para usar uma
> imagem nova, coloque o arquivo em `public/img/products/` e informe o caminho
> no campo de imagens, por exemplo `/img/products/meu-produto.jpg`.
> Formatos: `.jpg`, `.png` ou `.webp`. Tamanho ideal: 1200×1500 px (4:5).

### 2.2 Pelo arquivo `server/seed-data.js`

É onde estão os 48 produtos iniciais e as 8 categorias. Depois de editar:

```bash
npm run seed:force   # apaga e recria o catálogo com o conteúdo do arquivo
```

⚠️ `seed:force` **zera** produtos, pedidos, avaliações, favoritos e loadouts.
Em produção, prefira o painel ou um `INSERT` pontual.

Um produto é um objeto assim:

```js
{
  id: 'crossover-049',                     // único, nunca repita
  slug: 'boneco-totoro-30cm',              // vira a URL: /produto/boneco-totoro-30cm
  name: 'Pelúcia Totoro 30cm',
  category: 'plush',                       // precisa existir em `categories`
  collection: 'Studio Ghibli',             // vira uma coleção na vitrine
  price: 189.9,
  comparePrice: 249.9,                     // opcional: preço "de", riscado
  shortDescription: 'Pelúcia oficial de 30cm, tecido aveludado.',
  description: 'Texto longo que aparece na página do produto.',
  details: 'Inclui: 1 pelúcia. Não inclui: acessórios.',
  specs: { Composição: 'Poliéster e algodão', Altura: '30 cm' },
  images: ['/img/products/totoro-1.jpg', '/img/products/totoro-2.jpg'],
  sizes: ['Único'],                        // ou ['P','M','G']
  stock: 12,
  rating: 5,                               // 0 a 5
  reviewCount: 4,
  featured: true,                          // aparece na home
  badge: 'Novo',                           // selo curto (opcional)
}
```

**Categorias** (`categories`, no mesmo arquivo):

```js
{ slug: 'plush', name: 'Pelúcias', tagline: 'Para abraçar', description: '...',
  image: '/img/studio/editorial-rack.jpg', sortOrder: 9 }
```

O `slug` da categoria é o que você usa no campo `category` do produto.

---

## 3. Banco de dados: Turso

O projeto fala a API do **libSQL/Turso**, que é SQLite. Sem variáveis de
ambiente ele usa um arquivo local; com elas, usa a Turso na nuvem. O código é
o mesmo nos dois casos.

### 3.1 Criar o banco

1. Acesse <https://turso.tech> e entre com **GitHub** (`heitoresp.dev@gmail.com`).
2. **Create Database** → escolha a região mais próxima do público
   (`gru` = São Paulo, ou `iad` = Virgínia).
3. Anote a URL do banco, algo como
   `libsql://crossover-heitoresp.turso.io`.
4. Gere um token: `turso db tokens create crossover` (no painel, em
   **Connect** → **Create token**). Copie o valor — ele só aparece uma vez.

### 3.2 Enviar os dados locais para a Turso

Com `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` preenchidos no `.env`:

```bash
npm run db:push             # cria tabelas e envia os dados
npm run db:push -- --wipe   # recria tudo do zero (apaga o que está lá)
```

O script cria as tabelas, os índices e copia cada linha do arquivo local.
Rode de novo sempre que quiser "espelhar" o catálogo local na nuvem.

### 3.3 Backup

- **Turso**: `turso db shell crossover ".dump" > backup.sql` (ou use o botão
  de backup no painel).
- **Local**: copie `server/data/crossover.sqlite` (com o servidor parado).

---

## 4. Deploy no Railway

1. Suba o projeto para um repositório no GitHub.
2. Em <https://railway.app> → **New Project** → **Deploy from GitHub repo**.
3. Railway detecta Node automaticamente (há `railway.json` e `nixpacks.toml`
   prontos; o comando de build é `npm run build` e o start é `node server/index.js`).
4. Aba **Variables**, adicione:

   | Variável             | Valor                                   |
   |----------------------|-----------------------------------------|
   | `TURSO_DATABASE_URL` | `libsql://seu-banco.turso.io`           |
   | `TURSO_AUTH_TOKEN`   | o token gerado na Turso                 |
   | `JWT_SECRET`         | uma string longa e aleatória            |
   | `NODE_ENV`           | `production`                            |

   Para gerar o segredo:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   `PORT` é definido pelo Railway sozinho — **não** crie essa variável.
5. Em **Settings → Networking**, clique em **Generate Domain**.
6. Abra o domínio + `/api/health`: deve responder
   `{"ok":true,"db":"turso", ...}`.

Se a primeira carga de produtos estiver vazia, rode `npm run db:push` na sua
máquina apontando para o banco de produção (é o mesmo `.env` da Turso).

### O que já está configurado para produção

- `JWT_SECRET` obrigatório, cookie `secure` + `httpOnly` + `sameSite=lax`.
- CORS fechado (site e API no mesmo domínio); `ALLOWED_ORIGIN` libera outro
  domínio se precisar.
- `express.static` com cache e fallback do SPA para qualquer rota.
- Healthcheck em `/api/health`.

---

## 5. Estrutura da API

Todas as rotas começam em `/api`.

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/health` | status + qual banco está em uso |
| GET | `/products` | catálogo (`category`, `collection`, `q`, `sort`, `min`, `max`, `featured`, `limit`) |
| GET | `/products/:slug` | produto + relacionados + avaliações |
| GET | `/categories` | categorias com contagem de produtos |
| GET | `/search/suggestions?q=` | autocomplete |
| GET | `/shipping/:cep` | opções de frete pelo CEP |
| POST | `/auth/register` · `/auth/login` · `/auth/logout` | sessão (cookie) |
| GET | `/auth/me` | usuário logado |
| POST | `/auth/forgot` · `/auth/reset` | recuperação de senha |
| GET/POST/PUT/DELETE | `/account/addresses` | endereços do cliente |
| GET/POST/DELETE | `/favorites` | favoritos |
| GET/POST/DELETE | `/loadouts` | loadouts salvos |
| POST | `/orders` | cria pedido (pagamento simulado) |
| GET | `/orders` · `/orders/:id` | histórico e detalhe |
| POST | `/products/:id/reviews` | envia avaliação (entra na moderação) |
| GET | `/admin/stats` | painel: faturamento, pedidos, estoque baixo |
| GET/POST/PUT/DELETE | `/admin/products` | CRUD de produtos |
| GET/PATCH | `/admin/orders` | pedidos e mudança de status |
| GET/POST | `/admin/categories` | categorias |
| GET | `/admin/customers` | clientes |
| GET/PATCH/DELETE | `/admin/reviews` | moderação de avaliações |

Rotas de cliente exigem sessão; as de `/admin` exigem perfil `admin`.

---

## 6. Antes de abrir para o público

- [ ] Trocar as senhas de demonstração e criar a conta admin de verdade
      (apague `marina@` e `admin@` do banco).
- [ ] Definir `JWT_SECRET` forte em produção.
- [ ] Preencher os dados reais da empresa (razão social, CNPJ, endereço) no
      rodapé e nas páginas de política.
- [ ] Substituir os textos de demonstração do "Sobre" pela história real.
- [ ] Revisar preços, estoque e frete (a tabela de CEP é simplificada).

---

## 7. O que é simulado (importante)

- **Pagamento**: nenhuma cobrança acontece. O pedido nasce com
  `payment_status = simulated_pending` e o painel mostra o aviso. Para vender
  de verdade, integre um gateway (Mercado Pago, Stripe, Pagar.me) na rota
  `POST /api/orders` e troque esse status pelo retorno real.
- **Frete**: o cálculo usa uma tabela fixa de CEP → estado. Não consulta os
  Correios. Para preços reais, use a API dos Correios ou um serviço como
  Melhor Envio na rota `GET /api/shipping/:cep`.
- **E-mail**: recuperação de senha não envia e-mail; o token é gravado no
  banco e aparece no log do servidor. Ligue um provedor (Resend, SendGrid…)
  antes de abrir ao público.
- **Cartão**: o checkout **não** pede número de cartão. Se for integrar um
  gateway, nunca armazene dados de cartão — deixe o gateway cuidar disso.

---

## 8. LGPD e segurança

- Senhas são guardadas só como hash **bcrypt** (nunca em texto puro).
- Sessão em cookie `httpOnly` assinado (JWT), sem token exposto no JS.
- Dados pessoais coletados: nome, e-mail, telefone, CPF (opcional), endereço
  e histórico de pedidos. São usados apenas para entregar o pedido.
- Para excluir a conta de um cliente: apague as linhas dele em `users`,
  `addresses`, `favorites`, `loadouts` e anonimize `orders`
  (`customer_name`, `customer_email`, `customer_phone`).
- Não publique `.env` nem `server/data/*.sqlite` — o `.gitignore` já bloqueia.

---

## 9. Personalizando o visual

- **Cores**: `src/styles/tokens.css` — `--bg #080808`, `--purple #37096b`,
  `--amber #f09b0e`. Mudar ali muda o site inteiro.
- **Fontes**: Bricolage Grotesque (títulos) e Inter (texto), carregadas no
  `index.html`.
- **Textos da home**: `src/pages/Home.tsx`.
- **Menu e rodapé**: `src/components/Header.tsx` e `Footer.tsx`.
- **História da marca**: `src/pages/About.tsx`.

---

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `{"ok":false}` em `/api/health` | URL/token da Turso errados | confira as variáveis e se o token não expirou |
| Loja vazia em produção | banco novo, sem dados | `npm run db:push` com o `.env` de produção |
| 401 ao entrar no admin | sessão antiga ou senha trocada | saia, limpe o cookie e entre de novo |
| Imagem não aparece | caminho errado | o caminho começa com `/img/...` e o arquivo existe em `public/` |
| `database is locked` local | dois processos usando o mesmo arquivo | feche o outro `node server/index.js` |
