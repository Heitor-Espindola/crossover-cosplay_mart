import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { IconArrow, IconCheck } from './icons';
import { useToast } from '../context/AppContext';

export function Footer() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const { notify } = useToast();

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify({ tone: 'error', title: 'E-mail inválido', message: 'Confira o endereço e tente novamente.' });
      return;
    }
    setDone(true);
    notify({ tone: 'success', title: 'Inscrição confirmada', message: 'Você receberá nossos lançamentos em primeira mão.' });
    setEmail('');
  };

  return (
    <footer className="footer">
      <div className="footer__top container">
        <div className="footer__brand">
          <Logo light />
          <p className="footer__tag">
            O marketplace brasileiro de cosplay, games, quadrinhos, mangás e RPG. Vitrines independentes, curadoria
            nossa, envio para todo o país.
          </p>
          <div className="footer__social">
            {[
              ['Instagram', 'https://instagram.com'],
              ['TikTok', 'https://tiktok.com'],
              ['Pinterest', 'https://pinterest.com'],
              ['YouTube', 'https://youtube.com'],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="footer__cols">
          <div>
            <p className="eyebrow eyebrow--light">Loja</p>
            <Link to="/loja">Todas as peças</Link>
            <Link to="/colecoes">Coleções</Link>
            <Link to="/loja?categoria=kits">Kits completos</Link>
            <Link to="/loja?categoria=diy">Materiais DIY</Link>
            <Link to="/loadout">Loadout Builder</Link>
          </div>
          <div>
            <p className="eyebrow eyebrow--light">Crossover</p>
            <Link to="/sobre">Nossa história</Link>
            <Link to="/sobre#vendedores">Para vendedores</Link>
            <Link to="/sobre#comunidade">Comunidade</Link>
            <Link to="/contato">Contato</Link>
          </div>
          <div>
            <p className="eyebrow eyebrow--light">Ajuda</p>
            <Link to="/conta">Minha conta</Link>
            <Link to="/conta/pedidos">Meus pedidos</Link>
            <Link to="/ajuda#trocas">Trocas e devoluções</Link>
            <Link to="/ajuda#entrega">Prazos de entrega</Link>
            <Link to="/ajuda#medidas">Guia de medidas</Link>
          </div>
        </div>

        <div className="footer__news">
          <p className="eyebrow eyebrow--light">Novidades da Crossover</p>
          <p className="footer__news-title">Lançamentos, bastidores e convites para testes de figurino.</p>
          <form onSubmit={subscribe} className="footer__form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              aria-label="Seu e-mail"
            />
            <button type="submit" aria-label="Assinar">
              {done ? <IconCheck size={18} /> : <IconArrow size={18} />}
            </button>
          </form>
          <p className="footer__fine">Sem spam. Só o que vale a pena guardar.</p>
        </div>
      </div>

      <div className="footer__bottom container">
        <p>© {new Date().getFullYear()} Crossover Cosplay Mart · CNPJ 00.000.000/0001-00 · São Paulo, Brasil</p>
        <div className="footer__legal">
          <Link to="/ajuda#privacidade">Privacidade</Link>
          <Link to="/ajuda#termos">Termos</Link>
          <Link to="/ajuda">Políticas</Link>
          <span className="footer__pay">Pix · Boleto · Cartão</span>
        </div>
      </div>
      <div className="footer__marquee" aria-hidden="true">
        <span>Crossover Cosplay Mart — Mais que uma fantasia</span>
        <span>Crossover Cosplay Mart — Mais que uma fantasia</span>
      </div>
    </footer>
  );
}
