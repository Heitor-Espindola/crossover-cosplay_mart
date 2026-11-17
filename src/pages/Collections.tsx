import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Category, type Product } from '../lib/api';
import { ProductCard, ProductSkeleton } from '../components/ProductCard';
import { Reveal, Words } from '../components/Reveal';
import { IconArrow } from '../components/icons';
import './collections.css';

const COLLECTIONS = [
  {
    slug: 'ordem-do-crepusculo',
    name: 'Ordem do Crepúsculo',
    kicker: 'Figurinos de cavalaria e corte',
    description:
      'Uma coleção inspirada em cavaleiros, sacerdotisas e cortes de fantasia. Linho encorpado, couro vegano, capas assimétricas e bordados que brilham sob a luz do palco.',
    image: '/img/studio/editorial-dress.jpg',
    accent: '#5b6446',
  },
  {
    slug: 'aco-de-ebano',
    name: 'Aço de Ébano',
    kicker: 'Armaduras leves e articuladas',
    description:
      'Peças em EVA de alta densidade, resina e metal envelhecido. Estrutura sem peso: para personagens que passam o dia inteiro em cena.',
    image: '/img/studio/mood-dark.jpg',
    accent: '#2a2824',
  },
  {
    slug: 'rotas-do-norte',
    name: 'Rotas do Norte',
    kicker: 'Personagens andarilhos',
    description:
      'Sobretudos, túnicas, calças com forro e lanternas. A coleção para quem caminha muito — literalmente ou na narrativa.',
    image: '/img/studio/editorial-coat.jpg',
    accent: '#6f6a5f',
  },
  {
    slug: 'corte-de-outono',
    name: 'Corte de Outono',
    kicker: 'Veludo, bordô e bordados',
    description:
      'Vestidos de baile, capas de cerimônia e luvas longas. Tons de vinho, ouro velho e poeira — uma coleção feita para a noite.',
    image: '/img/studio/editorial-red-dress.jpg',
    accent: '#6e2b30',
  },
  {
    slug: 'cabelos-de-palco',
    name: 'Cabelos de Palco',
    kicker: 'Perucas prontas para o palco',
    description:
      'Fibra térmica, lace frontal e mechas coloridas, cortadas e modeladas pelas vitrines parceiras para chegarem prontas ao evento.',
    image: '/img/studio/editorial-hat.jpg',
    accent: '#a98a55',
  },
  {
    slug: 'reliquias',
    name: 'Relíquias',
    kicker: 'Espadas, grimórios e cajados',
    description:
      'Réplicas em resina, madeira e impressão 3D feitas por oficinas independentes. Peças de cena com peso, equilíbrio e detalhes fiéis às referências.',
    image: '/img/studio/atelier-hands.jpg',
    accent: '#521f23',
  },
  {
    slug: 'materiais-e-diy',
    name: 'Materiais e DIY',
    kicker: 'DIY e customização',
    description:
      'EVA, tintas metálicas, resinas, termomoldáveis e ferragens — os mesmos materiais usados pelas vitrines parceiras.',
    image: '/img/studio/atelier-paint.jpg',
    accent: '#414a32',
  },
  {
    slug: 'cuidados-e-manutencao',
    name: 'Cuidados e Manutenção',
    kicker: 'Maquiagem, perucas e reparo',
    description:
      'Tudo o que mantém um personagem impecável do primeiro ao último dia de evento: maquiagem, cuidado de peruca e reparo.',
    image: '/img/studio/beauty-makeup.jpg',
    accent: '#8d877a',
  },
];

export function CollectionsIndex() {
  return (
    <div className="collections-page">
      <header className="collections-hero">
        <div className="container">
          <p className="eyebrow">Coleções</p>
          <h1 className="display collections-hero__title">
            <Words text="Oito mundos," /> <em className="serif-italic">um só carrinho</em>.
          </h1>
          <p className="lede">
            Cada coleção reúne peças de várias vitrines em torno de uma referência cultural — materiais, cores e
            silhuetas que combinam entre si. Explore.
          </p>
        </div>
      </header>

      <div className="container collections-list">
        {COLLECTIONS.map((c, i) => (
          <Reveal key={c.slug} delay={40} className="col-row">
            <Link to={`/colecoes/${c.slug}`} className={`col-row__link ${i % 2 ? 'is-reverse' : ''}`}>
              <div className="col-row__media img-zoom">
                <img src={c.image} alt={c.name} loading="lazy" />
              </div>
              <div className="col-row__text">
                <p className="eyebrow">{c.kicker}</p>
                <h2 className="display col-row__title">{c.name}</h2>
                <p>{c.description}</p>
                <span className="link-underline">
                  Ver coleção <IconArrow size={14} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function CollectionDetail() {
  const { slug = '' } = useParams();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const meta = useMemo(() => COLLECTIONS.find((c) => c.slug === slug), [slug]);

  useEffect(() => {
    setProducts(null);
    api.products({ collection: meta?.name }).then(setProducts).catch(() => setProducts([]));
    api.categories().then(setCategories).catch(() => undefined);
  }, [meta?.name, slug]);

  if (!meta) {
    return (
      <div className="container empty-page">
        <p className="eyebrow">404</p>
        <h1 className="display">Coleção não encontrada.</h1>
        <Link to="/colecoes" className="btn">
          <span>Ver todas as coleções</span>
        </Link>
      </div>
    );
  }

  const categorySlugs = new Set((products || []).map((p) => p.category));
  const related = categories.filter((c) => categorySlugs.has(c.slug));

  return (
    <div className="collection-detail">
      <header className="col-hero">
        <div className="col-hero__media">
          <img src={meta.image} alt={meta.name} />
          <div className="col-hero__veil" />
        </div>
        <div className="container col-hero__content">
          <nav className="crumbs crumbs--light">
            <Link to="/">Início</Link>
            <span>/</span>
            <Link to="/colecoes">Coleções</Link>
            <span>/</span>
            <em>{meta.name}</em>
          </nav>
          <p className="eyebrow eyebrow--light">{meta.kicker}</p>
          <h1 className="display col-hero__title">{meta.name}</h1>
          <p className="col-hero__desc">{meta.description}</p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="col-detail__bar">
            <p className="shop__count">{products ? `${products.length} peças nesta coleção` : 'Carregando…'}</p>
            <div className="col-detail__cats">
              {related.map((c) => (
                <Link key={c.slug} to={`/loja?categoria=${c.slug}`} className="chip">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="product-grid">
            {products
              ? products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              : Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
          {products && products.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">Esta coleção está em produção.</p>
              <p>As peças chegam em breve. Enquanto isso, explore o catálogo completo.</p>
              <Link to="/loja" className="btn btn--ghost btn--sm">
                <span>Ver a loja</span>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
