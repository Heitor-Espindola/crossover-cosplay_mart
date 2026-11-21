import bcrypt from 'bcryptjs';
import { db, json, exec, transaction, initDb } from './db.js';
import { categories, products, reviewsSeed } from './seed-data.js';

export async function seedIfEmpty({ force = false } = {}) {
  await initDb();
  const count = (await db.prepare('SELECT COUNT(*) AS n FROM products').get()).n;
  if (count > 0 && !force) return false;

  if (force) {
    await exec(`
      TRUNCATE TABLE
        order_items,
        orders,
        reviews,
        loadouts,
        favorites,
        addresses,
        products,
        categories,
        password_resets,
        users
      RESTART IDENTITY CASCADE;
    `);
  }

  await transaction(async (tx) => {

    const insCat = tx.prepare(
      `INSERT INTO categories 
        (slug, name, tagline, description, image, sort_order)
      VALUES 
        (@slug, @name, @tagline, @description, @image, @sortOrder)
      ON CONFLICT (slug) DO NOTHING`,
    );
    for (const c of categories) await insCat.run(c);

    const insProd = tx.prepare(
      `INSERT INTO products
        (id, slug, name, category, collection, price, compare_price, short_description, description,
        details, specs, images, sizes, stock, rating, review_count, featured, badge)
      VALUES (@id, @slug, @name, @category, @collection, @price, @comparePrice, @shortDescription,
        @description, @details, @specs, @images, @sizes, @stock, @rating, @reviewCount, @featured, @badge)
      ON CONFLICT (id) DO NOTHING`,
    );
    for (const p of products) {
      await insProd.run({
        ...p,
        specs: json(p.specs),
        images: json(p.images),
        sizes: json(p.sizes),
      });
    }

    const password = bcrypt.hashSync('crossover123', 10);
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const insUser = tx.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, phone, cpf) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    // id fixo: o batch não devolve ids no meio da transação
    const customerId = 1;
    await insUser.run(customerId, 'Marina Alcântara', 'marina@crossover.com.br', password, 'customer', '(11) 98888-1234', '123.456.789-00');
    await insUser.run(2, 'Equipe Crossover', 'admin@crossover.com.br', adminPassword, 'admin', '(11) 97777-0000', null);

    await tx.prepare(
      `INSERT INTO addresses (user_id, label, recipient, cep, street, number, complement, district, city, state, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(customerId, 'Casa', 'Marina Alcântara', '01310-200', 'Avenida Paulista', '1500', 'Apto 82', 'Bela Vista', 'São Paulo', 'SP');

    await tx.prepare(
      `INSERT INTO addresses (user_id, label, recipient, cep, street, number, complement, district, city, state, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(customerId, 'Trabalho', 'Marina Alcântara', '05424-020', 'Rua dos Pinheiros', '320', 'Sala 4', 'Pinheiros', 'São Paulo', 'SP');

    const insReview = tx.prepare(
      `INSERT INTO reviews (id, product_id, author, rating, title, body, status) VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
    );
    let reviewId = 1;
    for (const r of reviewsSeed) await insReview.run(reviewId++, r.productId, r.author, r.rating, r.title, r.body);

    // Um pedido de exemplo para o histórico
    const orderId = 'CX-' + new Date().getFullYear() + '-1042';
    const item1 = products.find((p) => p.id === 'crossover-014');
    const item2 = products.find((p) => p.id === 'crossover-009');
    const subtotal = item1.price + item2.price;
    const shipping = 24.9;
    await tx.prepare(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, shipping_address,
        shipping_method, shipping_cost, payment_method, subtotal, total, status, payment_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP - INTERVAL '21 days')`,
    ).run(
      orderId,
      customerId,
      'Marina Alcântara',
      'marina@crossover.com.br',
      '(11) 98888-1234',
      json({ cep: '01310-200', street: 'Avenida Paulista', number: '1500', complement: 'Apto 82', district: 'Bela Vista', city: 'São Paulo', state: 'SP' }),
      'PAC',
      shipping,
      'pix',
      subtotal,
      subtotal + shipping,
      'delivered',
      'simulated_paid',
    );
    const insItem = tx.prepare(
      `INSERT INTO order_items (id, order_id, product_id, name, image, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    let itemId = 1;
    await insItem.run(itemId++, orderId, item1.id, item1.name, item1.images[0], 'M', 1, item1.price);
    await insItem.run(itemId++, orderId, item2.id, item2.name, item2.images[0], 'Único', 1, item2.price);

    const order2 = 'CX-' + new Date().getFullYear() + '-1057';
    await tx.prepare(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, shipping_address,
        shipping_method, shipping_cost, payment_method, subtotal, total, status, payment_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP - INTERVAL '4 days')`,
    ).run(
      order2,
      customerId,
      'Marina Alcântara',
      'marina@crossover.com.br',
      '(11) 98888-1234',
      json({ cep: '01310-200', street: 'Avenida Paulista', number: '1500', complement: 'Apto 82', district: 'Bela Vista', city: 'São Paulo', state: 'SP' }),
      'SEDEX',
      39.9,
      'credit_card',
      890,
      929.9,
      'shipped',
      'simulated_paid',
    );
    const wig = products.find((p) => p.id === 'crossover-011');
    await insItem.run(itemId++, order2, wig.id, wig.name, wig.images[0], 'Único', 1, wig.price);

    await tx.prepare(`INSERT INTO loadouts (id, user_id, name, items) VALUES (1, ?, ?, ?)`).run(
      customerId,
      'Cavaleira para o Anime Friends',
      json([
        { productId: 'crossover-001', size: 'M', quantity: 1 },
        { productId: 'crossover-014', size: 'Único', quantity: 1 },
        { productId: 'crossover-009', size: 'Único', quantity: 1 },
      ]),
    );
    await tx.prepare(`INSERT INTO favorites (user_id, product_id) VALUES (?, ?)`).run(customerId, 'crossover-019');
    await tx.prepare(`INSERT INTO favorites (user_id, product_id) VALUES (?, ?)`).run(customerId, 'crossover-035');

    // avaliações pendentes para a moderação do admin
    await insReview.run(reviewId++, 'crossover-002', 'Cliente Crossover', 5, 'Simplesmente perfeito', 'A cauda é maravilhosa nas fotos. Esperando ansiosamente.');
  });

  await db.prepare(`UPDATE reviews SET status = 'pending' WHERE title = 'Simplesmente perfeito'`).run();
  return true;
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const force = process.argv.includes('--force');
  seedIfEmpty({ force })
    .then(async (done) => {
      const n = (await db.prepare('SELECT COUNT(*) AS n FROM products').get()).n;
      console.log(done ? `Seed aplicado. ${n} produtos.` : `Banco já possui ${n} produtos. Use --force para recriar.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Falha no seed:', err);
      process.exit(1);
    });
}
