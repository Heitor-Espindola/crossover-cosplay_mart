import { Link } from 'react-router-dom';
import { IconArrow } from '../components/icons';

export function NotFound() {
  return (
    <div className="container empty-page" style={{ minHeight: '62vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
      <p className="eyebrow">Erro 404</p>
      <h1 className="display" style={{ fontSize: 'clamp(40px, 7vw, 96px)', fontWeight: 300 }}>
        Essa página saiu <em className="serif-italic" style={{ color: 'var(--olive)' }}>de cena</em>.
      </h1>
      <p className="lede" style={{ maxWidth: '48ch' }}>
        O endereço que você procurou não existe — ou o personagem foi para outra história.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <Link to="/" className="btn">
          <span>Voltar para a home <IconArrow size={16} /></span>
        </Link>
        <Link to="/loja" className="btn btn--ghost">
          <span>Ver a loja</span>
        </Link>
      </div>
    </div>
  );
}
