import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal, Words } from '../components/Reveal';
import { IconArrow, IconCheck, IconMail, IconPin, IconStore, IconTruck, IconUsers } from '../components/icons';
import { useReveal } from '../hooks/useReveal';
import './about.css';

const TIMELINE = [
  {
    year: '2023',
    title: 'Um trabalho de escola',
    text: 'Tudo começou como projeto de fim de ano: criar uma loja fictícia de cosplay para uma feira de empreendedorismo. Breno Shichinoe, Heitor Espíndola e João P. Militão fizeram o site, o nome e uma planilha de preços que nunca fechava.',
  },
  {
    year: '2024',
    title: 'O professor que disse “isso dá pé”',
    text: 'André Luis, professor da turma, devolveu o projeto com uma anotação na margem: “vocês têm um produto aqui, não uma nota”. Foi o empurrão que faltava para transformar a apresentação em plataforma.',
  },
  {
    year: '2024',
    title: 'As primeiras vitrines',
    text: 'Convidamos cinco ateliês de cosplay e uma oficina de resina para vender na Crossover. Todos tinham um problema em comum: receber pedidos por DM e planilha. A ideia era resolver só isso.',
  },
  {
    year: '2025',
    title: 'Além do cosplay',
    text: 'Os compradores pediam mangá, HQ, dado de RPG e figure. Abrimos as categorias e a curadoria passou a cobrir toda a cultura pop — de figurino a colecionável.',
  },
  {
    year: '2026',
    title: 'Loadout Builder',
    text: 'Lançamos a prancheta digital: montar um personagem inteiro, de vendedores diferentes, num só carrinho. Hoje é a ferramenta mais usada do site.',
  },
];

const FOUNDERS = [
  {
    name: 'Breno Shichinoe',
    role: 'Designer',
    text: 'Cuida do design da plataforma, criando uma experiência visual atraente e intuitiva para os usuários e seleção de imagens.',
    image: '/img/people/Breno.jpg',
  },
  {
    name: 'Heitor Espíndola',
    role: 'Desenvolvedor',
    text: 'Cuida do site, do checkout e de tudo que envolve código. Foi quem insistiu que a loja precisava funcionar bem no celular.',
    image: '/img/people/Heitor.jpg',
  },
  {
    name: 'João P. Militão',
    role: 'Projetistas',
    text: 'Responsável por ideias e concepções iniciais, além de coordenar a equipe de desenvolvimento.',
    image: '/img/people/Joao.jpg',
  },
];

const VALUES = [
  {
    title: 'Vitrine independente',
    text: 'Quem vende é gente real: ateliês, oficinas e ilustradores. A Crossover cuida da plataforma, do pagamento e do suporte.',
  },
  {
    title: 'Curadoria, não catálogo infinito',
    text: 'Preferimos 300 vitrines boas a 30 mil anúncios duplicados. Cada vendedor passa por análise antes de publicar.',
  },
  {
    title: 'Preço e prazo claros',
    text: 'Frete calculado por CEP, prazo informado na peça e nenhuma taxa surpresa no checkout.',
  },
  {
    title: 'Cultura pop inteira',
    text: 'Cosplay, games, quadrinhos, mangás, animes e RPG no mesmo lugar — porque quem gosta de um quase sempre gosta do outro.',
  },
];

const FAQ = [
  {
    q: 'A Crossover fabrica as peças que vende?',
    a: 'Não. A Crossover é um marketplace: cada peça é produzida e enviada pela vitrine que a anuncia. Nós cuidamos da plataforma, da curadoria, do pagamento e do atendimento ao comprador.',
  },
  {
    q: 'Como faço para vender na Crossover?',
    a: 'Você envia seu portfólio e uma amostra do que produz. A curadoria responde em até cinco dias úteis. Aprovado, você cria sua vitrine, cadastra peças e define preço, estoque e prazo de envio.',
  },
  {
    q: 'Posso comprar de vendedores diferentes num só pedido?',
    a: 'Sim. O carrinho é único e o pagamento também, mas cada vitrine envia a própria parte do pedido com rastreio separado — o prazo de cada envio aparece no acompanhamento.',
  },
  {
    q: 'Quanto tempo leva a entrega?',
    a: 'Depende da vitrine. Peças de pronta entrega saem em até 48h úteis; itens feitos sob encomenda têm prazo informado na página do produto. O transporte é PAC ou SEDEX, calculado pelo CEP.',
  },
  {
    q: 'Como funcionam as trocas?',
    a: 'A política é única para toda a plataforma: 7 dias para desistência após o recebimento e 30 dias para defeito de fabricação. A Crossover media o processo com o vendedor.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Neste protótipo, todos os pagamentos são simulados — nenhuma cobrança real é feita e nenhum dado de cartão é solicitado ou armazenado. Na versão final, aceitaríamos Pix, boleto e cartão em até 6x.',
  },
  {
    q: 'Vocês vendem produtos licenciados?',
    a: 'Somente quando a licença existe. A maior parte do catálogo é de peças inspiradas e artigos de fã, com arte e modelagem próprias — sem réplica de produto oficial.',
  },
  {
    q: 'A Crossover tem loja física?',
    a: 'Não. Somos 100% online: site, vitrines e envio para todo o Brasil.',
  },
];

export function About() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="about">
      <header className="about-hero">
        <div className="container about-hero__grid">
          <div>
            <p className="eyebrow">Sobre a Crossover</p>
            <h1 className="display about-hero__title">
              <Words text="De um projeto escolar" /> <em className="serif-italic">até uma marca real.</em>
            </h1>
            <p className="lede">
              A Crossover nasceu numa sala de aula e virou o marketplace brasileiro de cosplay, games, quadrinhos,
              mangás e RPG — com vitrines independentes e curadoria de verdade.
            </p>
            <div className="about-hero__facts">
              <div>
                <strong>2023</strong>
                <span>primeira apresentação</span>
              </div>
              <div>
                <strong>340+</strong>
                <span>vitrines independentes</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>online, todo o Brasil</span>
              </div>
            </div>
          </div>
          <div className="about-hero__media">
            <img src="/img/studio/editorial-detail.jpg" alt="Detalhe de uma peça vendida por uma vitrine parceira" />
          </div>
        </div>
      </header>

      <section className="about-manifesto">
        <div className="container about-manifesto__inner">
          <p className="about-manifesto__text">
            Quem gosta de cosplay também gosta de mangá, de HQ, de RPG, de jogo indie. A Crossover existe para que tudo
            isso caiba no mesmo carrinho — e para que quem faz essas coisas consiga vender sem virar especialista em
            planilha.
          </p>
          <p className="about-manifesto__sign">Breno, Heitor e João — fundadores</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Linha do tempo</p>
              <h2 className="display section-head__title">Da feira de escola ao marketplace.</h2>
            </div>
          </div>
          <div className="timeline">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year + t.title} delay={i * 60} className="timeline__row">
                <span className="timeline__year">{t.year}</span>
                <div className="timeline__content">
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-founders">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Quem está por trás</p>
              <h2 className="display section-head__title">
                Três amigos e um <em className="serif-italic">professor</em>.
              </h2>
            </div>
          </div>
          <div className="founders">
            {FOUNDERS.map((f, i) => (
              <Reveal key={f.name} delay={i * 90} className="founder">
                <div className="founder__media img-zoom">
                  <img src={f.image} alt={f.name} loading="lazy" />
                </div>
                <h3>{f.name}</h3>
                <p className="founder__role">{f.role}</p>
                <p className="founder__text">{f.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="founder-quote" delay={120}>
            <p className="serif-italic">
              “Entregaram um projeto de escola com mais cuidado do que muita empresa entrega um produto de verdade. Falei
              para continuarem — e aqui estamos.”
            </p>
            <p className="eyebrow">André Luis · professor e primeiro incentivador</p>
          </Reveal>
        </div>
      </section>

      <section className="section about-values">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Como trabalhamos</p>
              <h2 className="display section-head__title">Quatro regras que não mudam.</h2>
            </div>
          </div>
          <div className="about-values__grid">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 70} className="about-value">
                <span className="about-value__num">0{i + 1}</span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="vendedores">
        <div className="container about-two">
          <div className="about-two__media">
            <img src="/img/studio/atelier-paint.jpg" alt="Materiais de uma vitrine parceira" />
          </div>
          <div className="about-two__text">
            <p className="eyebrow">Para quem vende</p>
            <h2 className="display">Sua vitrine, suas regras.</h2>
            <p>
              Na Crossover, cada vendedor mantém a própria vitrine: cadastra as peças, define preço, estoque e prazo de
              envio. A plataforma cuida do checkout, do cálculo de frete, das avaliações e do atendimento ao comprador.
            </p>
            <p>
              Não cobramos mensalidade. A curadoria aprova o portfólio antes de publicar, porque um marketplace só
              funciona se o comprador confiar em qualquer vitrine que apareça na busca.
            </p>
            <div className="about-two__facts">
              <div>
                <IconStore size={16} />
                <span>Vitrine própria, com catálogo e estoque</span>
              </div>
              <div>
                <IconUsers size={16} />
                <span>Curadoria de portfólio antes de publicar</span>
              </div>
              <div>
                <IconTruck size={16} />
                <span>Frete e rastreio integrados por vendedor</span>
              </div>
            </div>
            <Link to="/contato" className="btn btn--sm" style={{ marginTop: 24 }}>
              <span>
                Quero vender na Crossover <IconArrow size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section faq" id="faq">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Dúvidas frequentes</p>
              <h2 className="display section-head__title">Perguntas que chegam todo dia.</h2>
            </div>
          </div>
          <FaqList openFaq={openFaq} setOpenFaq={setOpenFaq} />
        </div>
      </section>

      <section className="about-cta">
        <div className="container about-cta__inner">
          <h2 className="display">
            Pronto para <em className="serif-italic">começar</em>?
          </h2>
          <p>Explore as vitrines ou monte um personagem completo no Loadout Builder.</p>
          <div className="about-cta__btns">
            <Link to="/loja" className="btn">
              <span>Explorar a loja <IconArrow size={16} /></span>
            </Link>
            <Link to="/loadout" className="btn btn--ghost">
              <span>Montar um loadout</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqList({ openFaq, setOpenFaq }: { openFaq: number | null; setOpenFaq: (v: number | null) => void }) {
  return (
    <div className="faq__list">
      {FAQ.map((f, i) => (
        <div key={f.q} className={`faq__item ${openFaq === i ? 'is-open' : ''}`}>
          <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
            <span>{f.q}</span>
            <span className="faq__sign">{openFaq === i ? '−' : '+'}</span>
          </button>
          <div className="faq__answer">
            <p>{f.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const HELP_TOPICS = [
  { icon: IconTruck, title: 'Entrega e prazos', text: 'Prazos por vitrine, transportadoras e rastreio.' },
  { icon: IconCheck, title: 'Trocas e devoluções', text: 'Política única para toda a plataforma.' },
  { icon: IconStore, title: 'Para vendedores', text: 'Como abrir sua vitrine na Crossover.' },
];

export function Help() {
  const { ref, visible } = useReveal();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="about">
      <header className="help-hero">
        <div className="container">
          <p className="eyebrow">Ajuda</p>
          <h1 className="display about-hero__title">
            Central de <em className="serif-italic">ajuda</em>.
          </h1>
          <p className="lede">Prazos, tamanhos, trocas, pagamento e como vender na Crossover.</p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="help-topics" ref={ref} data-visible={visible}>
            {HELP_TOPICS.map((t) => (
              <div key={t.title} className="help-topic">
                <t.icon size={20} />
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section faq">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Perguntas frequentes</p>
              <h2 className="display section-head__title">Respostas diretas.</h2>
            </div>
          </div>
          <FaqList openFaq={open} setOpenFaq={setOpen} />
        </div>
      </section>

      <ContactBlock />
    </div>
  );
}

function ContactBlock() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'Pedido', message: '' });
  const [sent, setSent] = useState(false);

  return (
    <section className="section contact" id="contato">
      <div className="container contact__grid">
        <div>
          <p className="eyebrow">Contato</p>
          <h2 className="display contact__title">Fale com a Crossover.</h2>
          <p className="contact__sub">
            Dúvidas sobre um pedido, uma peça ou sobre vender na plataforma? Escreva — quem responde é gente de verdade.
          </p>
          <ul className="contact__info">
            <li>
              <IconMail size={16} /> contato@crossovercosplay.com.br
            </li>
            <li>
              <IconPin size={16} /> 100% online · São Paulo — SP
            </li>
            <li>
              <IconStore size={16} /> Quero abrir uma vitrine → assunto “Para vendedores”
            </li>
            <li>
              <IconTruck size={16} /> Seg a sex, 9h às 18h (horário de Brasília)
            </li>
          </ul>
          <p className="contact__note">
            Este é um protótipo: o formulário não envia e-mails reais. Nenhuma mensagem é armazenada.
          </p>
        </div>
        <form
          className="contact__form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          {sent ? (
            <div className="contact__sent">
              <p className="auth__sent-icon">
                <IconCheck size={22} />
              </p>
              <h3>Mensagem registrada (simulação).</h3>
              <p>Em uma loja real, você receberia uma resposta em até um dia útil.</p>
              <button type="button" className="link-underline" onClick={() => setSent(false)}>
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <>
              <div className="field">
                <label>Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label>Assunto</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option>Pedido</option>
                  <option>Medidas e tamanhos</option>
                  <option>Trocas e devoluções</option>
                  <option>Para vendedores</option>
                  <option>Loadout Builder</option>
                  <option>Outro</option>
                </select>
              </div>
              <div className="field">
                <label>Mensagem</label>
                <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <button className="btn">
                <span>Enviar mensagem</span>
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}

export function Contact() {
  return <Help />;
}
