import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Category, type Product } from '../lib/api';
import { formatBRL } from '../lib/format';
import { Reveal, Words } from '../components/Reveal';
import { ProductCard, ProductSkeleton } from '../components/ProductCard';
import { useScrollProgress, useReducedMotion } from '../hooks/useReveal';
import { IconArrow, IconHeart, IconScissors, IconShield, IconSparkle, IconTruck } from '../components/icons';
import { DragCarousel } from '../components/DragCarousel';
import './home.css';

const COLLECTIONS = [
  {
    slug: 'ordem-do-crepusculo',
    name: 'Ordem do Crepúsculo',
    count: 'Figurinos de cavalaria e corte',
    image: '/img/studio/editorial-dress.jpg',
  },
  {
    slug: 'aco-de-ebano',
    name: 'Aço de Ébano',
    count: 'Armaduras leves e articuladas',
    image: '/img/studio/mood-dark.jpg',
  },
  {
    slug: 'rotas-do-norte',
    name: 'Rotas do Norte',
    count: 'Personagens andarilhos',
    image: '/img/studio/editorial-coat.jpg',
  },
  {
    slug: 'corte-de-outono',
    name: 'Corte de Outono',
    count: 'Veludo, bordô e bordados',
    image: '/img/studio/editorial-red-dress.jpg',
  },
  {
    slug: 'cabelos-de-palco',
    name: 'Cabelos de Palco',
    count: 'Perucas prontas para o palco',
    image: '/img/studio/editorial-hat.jpg',
  },
  {
    slug: 'reliquias',
    name: 'Relíquias',
    count: 'Espadas, grimórios e cajados',
    image: '/img/studio/atelier-hands.jpg',
  },
];

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [newIn, setNewIn] = useState<Product[] | null>(null);
  const reduced = useReducedMotion();
  const heroMediaRef = useRef<HTMLDivElement | null>(null);
  const heroCopyRef = useRef<HTMLDivElement | null>(null);
  const storyMainRef = useRef<HTMLImageElement | null>(null);
  const storySmallRef = useRef<HTMLImageElement | null>(null);

  // Paralaxe escrita direto em transform (compositor), sem re-render do React
  const hero = useScrollProgress<HTMLElement>((p) => {
    if (reduced) return;
    const t = Math.min(1, Math.max(0, (p - 0.5) * 2));
    const media = heroMediaRef.current;
    const copy = heroCopyRef.current;
    if (media) media.style.transform = `translate3d(0, ${t * 90}px, 0) scale(${1 + t * 0.08})`;
    if (copy) {
      copy.style.opacity = String(1 - t * 0.85);
      copy.style.transform = `translate3d(0, ${t * -40}px, 0)`;
    }
  });

  const story = useScrollProgress<HTMLElement>((p) => {
    if (reduced) return;
    if (storyMainRef.current)
      storyMainRef.current.style.transform = `translate3d(0, ${(p - 0.5) * -60}px, 0) scale(1.08)`;
    if (storySmallRef.current)
      storySmallRef.current.style.transform = `translate3d(0, ${(p - 0.5) * 90}px, 0)`;
  });

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
    api.products({ featured: 'true', limit: '8' }).then(setFeatured).catch(() => setFeatured([]));
    api.products({ sort: 'newest', limit: '6' }).then(setNewIn).catch(() => setNewIn([]));
  }, []);

  return (
    <div className="home">
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="hero" ref={hero.ref}>
        <div className="hero__media" ref={heroMediaRef}>
          <img src="/img/studio/hero-portrait.jpg" alt="Modelo em cosplay da Crossover" fetchPriority="high" />
          <div className="hero__veil" />
        </div>

        <div className="hero__content container" ref={heroCopyRef}>
          <p className="eyebrow eyebrow--light hero__eyebrow">
            <span className="hero__dot" /> Cosplay · games · quadrinhos · mangá · RPG
          </p>
          <h1 className="hero__title">
            <span className="hero__line">
              <Words text="Mais que uma fantasia." />
            </span>
            <span className="hero__line hero__line--italic">
              <em>
                <Words text="Torne-se o personagem." delay={260} />
              </em>
            </span>
          </h1>
          <p className="hero__sub reveal is-visible">
            Descubra peças, detalhes e criações de vendedores independentes que dão vida aos seus mundos favoritos.
          </p>
          <div className="hero__ctas">
            <Link to="/loja" className="btn btn--light">
              <span>
                Explorar a coleção <IconArrow size={16} />
              </span>
            </Link>
            <Link to="/sobre" className="btn btn--ghost-light">
              <span>Conhecer a Crossover</span>
            </Link>
          </div>
        </div>

        <div className="hero__bottom container">
          <div className="hero__scroll">
            <span className="hero__scroll-line" />
            Role para explorar
          </div>
          <div className="hero__meta">
            <div>
              <strong>120+</strong>
              <span>peças no catálogo</span>
            </div>
            <div>
              <strong>4.8</strong>
              <span>média de avaliações</span>
            </div>
            <div>
              <strong>340</strong>
              <span>vendedores no Brasil</span>
            </div>
          </div>
        </div>

        <div className="hero__side" aria-hidden="true">
          <span>SS/26</span>
          <span className="hero__side-line" />
          <span>Coleção Ordem do Crepúsculo</span>
        </div>
      </section>

      {/* --------------------------- MANIFESTO ----------------------------- */}
      <section className="manifesto">
        <div className="container manifesto__grid">
          <Reveal className="manifesto__label">
            <p className="eyebrow">01 — A experiência Crossover</p>
          </Reveal>
          <div className="manifesto__body">
            <h2 className="manifesto__title display">
              <Words text="Vestir um personagem é um ato de" /> <em className="serif-italic">coragem</em>{' '}
              <Words text="e de carinho." delay={200} />
            </h2>
            <Reveal delay={200}>
              <p className="lede">
                A Crossover começou como um trabalho de escola: três amigos queriam um lugar para comprar peças de
                cosplay sem depender de importação. Hoje somos um marketplace — cada vendedor tem sua vitrine, sua
                história e suas peças, e a curadoria é nossa.
              </p>
            </Reveal>
            <Reveal delay={320} className="manifesto__sign">
              <span className="serif-italic">Breno, Heitor e João</span>
              <span className="eyebrow">Fundadores · Crossover</span>
            </Reveal>
          </div>
        </div>
        <div className="manifesto__ticker" aria-hidden="true">
          <div className="manifesto__ticker-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k}>
                Vendedores independentes <i>✳</i> Curadoria própria <i>✳</i> Envio de todo o Brasil <i>✳</i> Cosplay,
                mangá, HQ e RPG <i>✳</i>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- HISTÓRIA ----------------------------- */}
      <section className="story" ref={story.ref}>
        <div className="container story__grid">
          <div className="story__media story__media--main">
            <div className="story__img-wrap">
              <img
                src="/img/studio/atelier-hands.jpg"
                alt="Detalhe de uma peça em produção"
                loading="lazy"
                ref={storyMainRef}
              />
            </div>
            <p className="story__caption">Peça de vendedor independente · São Paulo, SP</p>
          </div>
          <div className="story__copy">
            <p className="eyebrow">02 — O marketplace</p>
            <h2 className="display story__title">
              De vendedor a <em className="serif-italic">vendedor</em>.
            </h2>
            <p className="lede">
              A Crossover não fabrica tudo o que vende — e isso é de propósito. Reunimos ateliês de cosplay, oficinas de
              resina, ilustradores e lojas de colecionáveis num só lugar, com avaliação real, prazo claro e a mesma
              política de troca para todos.
            </p>
            <ul className="story__steps">
              {[
                ['Curadoria', 'Cada vendedor passa por análise de portfólio antes de abrir vitrine.'],
                ['Vitrines', 'Vendedores cuidam do próprio catálogo, estoque e preço.'],
                ['Pedido', 'Você compra de vários vendedores num único checkout.'],
                ['Envio', 'Cada vitrine posta com rastreio; o prazo aparece na peça.'],
                ['Avaliações', 'Quem compra avalia de verdade — sem nota comprada.'],
                ['Suporte', 'A Crossover responde por qualquer pedido da plataforma.'],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span className="story__num">0{i + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="story__media story__media--small">
            <img
              src="/img/studio/atelier-paint.jpg"
              alt="Materiais de uma das vitrines"
              loading="lazy"
              ref={storySmallRef}
            />
          </div>
        </div>
      </section>

      {/* --------------------------- COLEÇÕES ------------------------------ */}
      <section className="collections section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">03 — Vitrines em destaque</p>
              <h2 className="display section-head__title">
                Mundos para <em className="serif-italic">habitar</em>.
              </h2>
            </div>
            <Link to="/colecoes" className="link-underline">
              Ver todas as coleções <IconArrow size={14} />
            </Link>
          </div>
        </div>

        <div className="collections__grid container">
          {COLLECTIONS.slice(0, 2).map((c, i) => (
            <Reveal key={c.slug} delay={i * 120} className="collections__cell collections__cell--wide">
              <Link to={`/colecoes/${c.slug}`} className="ccard img-zoom">
                <img src={c.image} alt={c.name} loading="lazy" />
                <div className="ccard__overlay">
                  <p className="eyebrow eyebrow--light">{c.count}</p>
                  <h3>{c.name}</h3>
                  <span className="ccard__cta">
                    Explorar <IconArrow size={16} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
          {COLLECTIONS.slice(2, 6).map((c, i) => (
            <Reveal key={c.slug} delay={i * 90} className="collections__cell">
              <Link to={`/colecoes/${c.slug}`} className="ccard ccard--sm img-zoom">
                <img src={c.image} alt={c.name} loading="lazy" />
                <div className="ccard__overlay">
                  <p className="eyebrow eyebrow--light">{c.count}</p>
                  <h3>{c.name}</h3>
                  <span className="ccard__cta">
                    Explorar <IconArrow size={16} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------- SHOWCASE ----------------------------- */}
      <section className="showcase section--dark section" >
        <div className="container showcase__head">
          <div>
            <p className="eyebrow eyebrow--light">04 — Editorial</p>
            <h2 className="display showcase__title">
              Fotografado como <em className="serif-italic">cultura pop</em>.
            </h2>
          </div>
          <p className="lede showcase__lede">
            Fotografias de produto feitas com luz natural, modelos reais de cosplay e zero filtro pesado. O que aparece
            na vitrine é o que chega na sua casa.
          </p>
        </div>

        <div className="social container">
          {[
            ['/img/studio/editorial-model-2.jpg', 'Corte de Outono', 'Vestido da Corte de Outono', '@crossover.cos', '2.4k'],
            ['/img/studio/editorial-detail.jpg', 'Detalhe', 'Acabamento de vitrine', '@oficina.ebano', '980'],
            ['/img/studio/editorial-mood.jpg', 'Ordem do Crepúsculo', 'Figurino Cavaleira', '@casa.yume', '3.1k'],
            ['/img/studio/editorial-hat.jpg', 'Cabelos de Palco', 'Peruca Ondas de Âmbar', '@ateli.ronin', '1.7k'],
            ['/img/studio/editorial-street.jpg', 'Rotas do Norte', 'Capa de Cerimônia', '@forja.norte', '860'],
          ].map(([src, label, caption, handle, likes], i) => (
            <Reveal key={src} delay={i * 70} className="social__cell">
              <a className="social__card" href="https://instagram.com" target="_blank" rel="noreferrer">
                <div className="social__media">
                  <img src={src} alt={caption} loading="lazy" />
                  <span className="social__handle">{handle}</span>
                </div>
                <div className="social__body">
                  <p className="eyebrow eyebrow--light">{label}</p>
                  <p className="social__caption">{caption}</p>
                  <div className="social__meta">
                    <span>
                      <IconHeart size={13} filled /> {likes}
                    </span>
                    <span className="social__open">
                      Ver post <IconArrow size={13} />
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="container showcase__foot">
          <Link to="/loja" className="link-underline">
            Ver o catálogo completo <IconArrow size={14} />
          </Link>
        </div>
      </section>

      {/* ---------------------------- DESTAQUES ---------------------------- */}
      <section className="featured section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">05 — Peças selecionadas</p>
              <h2 className="display section-head__title">
                Escolhidas pela <em className="serif-italic">equipe</em>.
              </h2>
            </div>
            <Link to="/loja" className="link-underline">
              Ver tudo <IconArrow size={14} />
            </Link>
          </div>
        </div>
        <div className="container">
          <div className="product-grid">
            {featured
              ? featured.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              : Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        </div>
      </section>

      {/* -------------------------- LOADOUT BUILDER ------------------------ */}
      <section className="builder">
        <div className="builder__bg" aria-hidden="true">
          <img src="/img/studio/architecture-white.jpg" alt="" loading="lazy" />
        </div>
        <div className="container builder__grid">
          <div className="builder__copy">
            <p className="eyebrow">06 — Loadout Builder</p>
            <h2 className="display builder__title">
              Monte seu look
              <br />
              <em className="serif-italic">peça por peça</em>.
            </h2>
            <p className="lede">
              Combine figurino, peruca, armadura e adereços em uma prancheta digital. Veja o total se atualizar em tempo
              real, salve sua composição e envie tudo para a sacola quando estiver pronto.
            </p>
            <ul className="builder__list">
              <li>Filtre por categoria e monte em segundos</li>
              <li>Veja o preço total mudar enquanto escolhe</li>
              <li>Salve seu loadout na sua conta</li>
            </ul>
            <Link to="/loadout" className="btn">
              <span>
                Abrir o Loadout Builder <IconArrow size={16} />
              </span>
            </Link>
          </div>
          <div className="builder__visual">
            <div className="builder__panel">
              <div className="builder__panel-head">
                <span className="eyebrow">Loadout em construção</span>
                <span className="builder__panel-total">R$ 2.109,80</span>
              </div>
              {[
                ['/img/studio/editorial-dress.jpg', 'Figurino Cavaleira', 'R$ 1.489,90'],
                ['/img/studio/mood-dark.jpg', 'Ombreira de Guardião', 'R$ 459,90'],
                ['/img/people/model-2.jpg', 'Peruca Ondas de Âmbar', 'R$ 429,90'],
              ].map(([src, name, price], i) => (
                <div className="builder__row" key={name} style={{ ['--i' as string]: i }}>
                  <img src={src} alt="" loading="lazy" />
                  <span>{name}</span>
                  <b>{price}</b>
                </div>
              ))}
              <div className="builder__panel-foot">
                <span>3 peças · 1 personagem</span>
                <span className="builder__dots">
                  <i /> <i /> <i />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- POR QUÊ ----------------------------- */}
      <section className="why section section--sand">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">07 — Por que Crossover</p>
              <h2 className="display section-head__title">
                Detalhe é o que faz <em className="serif-italic">personagem</em>.
              </h2>
            </div>
          </div>
          <div className="why__grid">
            {[
              [<IconScissors size={26} key="s" />, 'Curadoria de verdade', 'Cada vitrine é analisada antes de entrar: portfólio, prazo e histórico de vendas.'],
              [<IconSparkle size={26} key="sp" />, 'Muitos mundos', 'Cosplay, games, quadrinhos, mangás, animes e RPG no mesmo carrinho.'],
              [<IconShield size={26} key="sh" />, 'Compra protegida', 'Pagamento simulado, mediação de conflito e política única de troca para a plataforma.'],
              [<IconTruck size={26} key="t" />, 'Entrega com rastreio', 'Vendedores de todo o Brasil, frete calculado por CEP e grátis acima de R$ 499.'],
            ].map(([icon, title, text], i) => (
              <Reveal key={title as string} delay={i * 90} className="why__card">
                <span className="why__icon">{icon}</span>
                <h3>{title as string}</h3>
                <p>{text as string}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- COMUNIDADE --------------------------- */}
      <section className="community section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">08 — Comunidade</p>
              <h2 className="display section-head__title">
                Quem veste <em className="serif-italic">Crossover</em>.
              </h2>
            </div>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="link-underline">
              @crossovercosplay <IconArrow size={14} />
            </a>
          </div>
        </div>
        <DragCarousel>
          {[
            ['/img/people/model-1.jpg', '@larissa.cx', 'Peruca Ondas de Âmbar'],
            ['/img/people/model-2.jpg', '@mari.alcantara', 'Cavaleira do Crepúsculo'],
            ['/img/people/model-3.jpg', '@bruna.reis', 'Noite de Prata'],
            ['/img/people/model-5.jpg', '@tatisouza', 'Lace Aurora'],
            ['/img/people/model-7.jpg', '@diego.martins', 'Guardião do Portão'],
            ['/img/people/model-8.jpg', '@camila.prado', 'Corte de Outono'],
            ['/img/people/model-9.jpg', '@helena.cos', 'Sacerdotisa de Âmbar'],
            ['/img/people/model-10.jpg', '@rafa.duarte', 'Rotas do Norte'],
          ].map(([src, handle, piece]) => (
            <a
              className="community__item"
              key={handle}
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              draggable={false}
            >
              <div className="community__img">
                <img src={src} alt={`Cosplay de ${handle}`} loading="lazy" draggable={false} />
                <span className="community__tag">#{piece.split(' ')[0].toLowerCase()}</span>
              </div>
              <figcaption>
                <p className="community__handle">{handle}</p>
                <p className="community__piece">{piece}</p>
              </figcaption>
            </a>
          ))}
        </DragCarousel>
        <div className="container">
          <Reveal className="community__quote">
            <p className="serif-italic community__quote-text">
              “Cheguei para uma convenção de três dias e voltei com o figurino intacto — e com três pessoas perguntando
              onde eu comprei.”
            </p>
            <p className="eyebrow">Marina A. · cliente desde 2022 · Cavaleira do Crepúsculo</p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------- NOVIDADES ---------------------------- */}
      <section className="newin section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">09 — Novidades da semana</p>
              <h2 className="display section-head__title">
                Recém-chegadas.
              </h2>
            </div>
            <Link to="/loja?sort=newest" className="link-underline">
              Ver novidades <IconArrow size={14} />
            </Link>
          </div>
          <div className="product-grid product-grid--3">
            {newIn
              ? newIn.slice(0, 3).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              : Array.from({ length: 3 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        </div>
      </section>

      {/* ------------------------------ CTA -------------------------------- */}
      <section className="final-cta">
        <div className="final-cta__media" aria-hidden="true">
          <img src="/img/studio/editorial-shopping.jpg" alt="" loading="lazy" />
        </div>
        <div className="container final-cta__inner">
          <p className="eyebrow eyebrow--light">10 — O próximo personagem</p>
          <h2 className="display final-cta__title">
            Já sabe quem você vai <em className="serif-italic">ser</em>?
          </h2>
          <p className="final-cta__sub">
            Explore o catálogo, monte seu loadout e leve para casa peças de quem entende do assunto.
          </p>
          <div className="final-cta__ctas">
            <Link to="/loja" className="btn btn--light">
              <span>
                Explorar a coleção <IconArrow size={16} />
              </span>
            </Link>
            <Link to="/loadout" className="btn btn--ghost-light">
              <span>Montar meu loadout</span>
            </Link>
          </div>
          <div className="final-cta__cats">
            {categories.slice(0, 5).map((c) => (
              <Link key={c.slug} to={`/loja?categoria=${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
        <p className="final-cta__egg" title="Para quem leu até aqui">
          ✦ psst: use o cupom <strong>CRUZAMENTO10</strong> na primeira compra.
        </p>
      </section>
    </div>
  );
}

export function PriceTag({ value }: { value: number }) {
  return <>{formatBRL(value)}</>;
}
