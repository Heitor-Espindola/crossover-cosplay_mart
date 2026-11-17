import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth, useToast } from '../context/AppContext';
import { IconArrow, IconCheck } from '../components/icons';
import './auth.css';

function AuthShell({ children, quote }: { children: React.ReactNode; quote: { text: string; author: string; image: string } }) {
  return (
    <div className="auth">
      <div className="auth__panel">{children}</div>
      <aside className="auth__aside">
        <img src={quote.image} alt="" />
        <div className="auth__aside-veil" />
        <div className="auth__aside-content">
          <p className="eyebrow eyebrow--light">Comunidade Crossover</p>
          <p className="auth__quote serif-italic">“{quote.text}”</p>
          <p className="auth__author">{quote.author}</p>
        </div>
      </aside>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/conta';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      notify({ tone: 'success', title: `Bem-vindo de volta, ${u.name.split(' ')[0]}`, message: 'Sua conta está pronta.' });
      navigate(u.role === 'admin' ? '/admin' : next, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const demo = (kind: 'customer' | 'admin') => {
    setEmail(kind === 'admin' ? 'admin@crossover.com.br' : 'marina@crossover.com.br');
    setPassword(kind === 'admin' ? 'admin123' : 'crossover123');
  };

  return (
    <AuthShell
      quote={{
        text: 'Entrei achando que ia comprar uma peruca. Saí com um personagem inteiro.',
        author: 'Marina A. — cliente desde 2022',
        image: '/img/people/model-2.jpg',
      }}
    >
      <div className="auth__head">
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1 className="display auth__title">Entre na sua conta.</h1>
        <p className="auth__sub">Acesse seus pedidos, favoritos e loadouts salvos.</p>
      </div>

      <form className="auth__form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Senha</label>
          <input id="login-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        {error && <p className="auth__error">{error}</p>}
        <button className="btn btn--block" disabled={loading}>
          <span>{loading ? 'Entrando…' : 'Entrar'} <IconArrow size={16} /></span>
        </button>
        <div className="auth__row">
          <Link to="/recuperar-senha" className="auth__link">
            Esqueci minha senha
          </Link>
          <Link to={`/cadastro${next !== '/conta' ? `?next=${next}` : ''}`} className="auth__link">
            Criar conta
          </Link>
        </div>
      </form>

      <div className="auth__demo">
        <p className="eyebrow">Acesso de demonstração</p>
        <div className="auth__demo-btns">
          <button type="button" onClick={() => demo('customer')}>
            Cliente — marina@crossover.com.br
          </button>
          <button type="button" onClick={() => demo('admin')}>
            Admin — admin@crossover.com.br
          </button>
        </div>
        <p className="auth__demo-note">Senhas: crossover123 (cliente) · admin123 (admin). Dados fictícios de protótipo.</p>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/conta';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('A senha precisa ter ao menos 6 caracteres.');
    if (form.password !== form.confirm) return setError('As senhas não coincidem.');
    setLoading(true);
    try {
      const u = await register(form.name, form.email, form.password);
      notify({ tone: 'success', title: `Bem-vindo à Crossover, ${u.name.split(' ')[0]}`, message: 'Sua conta foi criada.' });
      navigate(next, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      quote={{
        text: 'Cada personagem começa com uma decisão pequena: criar uma conta e escolher a primeira peça.',
        author: 'Crossover Cosplay Mart',
        image: '/img/people/model-1.jpg',
      }}
    >
      <div className="auth__head">
        <p className="eyebrow">Primeira vez por aqui</p>
        <h1 className="display auth__title">Crie sua conta.</h1>
        <p className="auth__sub">Leva menos de um minuto — e seu primeiro personagem começa aqui.</p>
      </div>
      <form className="auth__form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="reg-name">Nome completo</label>
          <input id="reg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label htmlFor="reg-email">E-mail</label>
          <input id="reg-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label htmlFor="reg-pass">Senha</label>
          <input id="reg-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </div>
        <div className="field">
          <label htmlFor="reg-confirm">Confirme a senha</label>
          <input id="reg-confirm" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </div>
        {error && <p className="auth__error">{error}</p>}
        <button className="btn btn--block" disabled={loading}>
          <span>{loading ? 'Criando…' : 'Criar minha conta'} <IconArrow size={16} /></span>
        </button>
        <p className="auth__terms">
          Ao criar a conta você concorda com nossos termos e com a política de privacidade. Nunca compartilhamos seus
          dados.
        </p>
      </form>
      <p className="auth__switch">
        Já tem conta? <Link to={`/entrar${next !== '/conta' ? `?next=${next}` : ''}`}>Entrar</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.forgot(email);
      setSent(res.message);
      setDemoToken(res.demoToken);
    } catch (err) {
      notify({ tone: 'error', title: 'Erro', message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      quote={{
        text: 'Sua vitrine não fecha. Seu acesso também não.',
        author: 'Crossover Cosplay Mart',
        image: '/img/studio/editorial-hat.jpg',
      }}
    >
      <div className="auth__head">
        <p className="eyebrow">Recuperação de senha</p>
        <h1 className="display auth__title">Acontece com todo mundo.</h1>
        <p className="auth__sub">Informe seu e-mail e enviaremos as instruções para criar uma nova senha.</p>
      </div>
      {!sent ? (
        <form className="auth__form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="forgot-email">E-mail da conta</label>
            <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn--block" disabled={loading}>
            <span>{loading ? 'Enviando…' : 'Enviar instruções'}</span>
          </button>
        </form>
      ) : (
        <div className="auth__sent">
          <p className="auth__sent-icon">
            <IconCheck size={22} />
          </p>
          <p>{sent}</p>
          {demoToken && (
            <p className="auth__demo-note">
              Ambiente de demonstração: e-mail não é enviado de verdade. Use este link para redefinir:{' '}
              <Link to={`/redefinir-senha?token=${demoToken}`}>redefinir senha</Link>
            </p>
          )}
        </div>
      )}
      <p className="auth__switch">
        <Link to="/entrar">Voltar para o login</Link>
      </p>
    </AuthShell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = params.get('token') || '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('A senha precisa ter ao menos 6 caracteres.');
    if (password !== confirm) return setError('As senhas não coincidem.');
    setLoading(true);
    try {
      await api.reset(token, password);
      notify({ tone: 'success', title: 'Senha redefinida', message: 'Agora você pode entrar com a nova senha.' });
      navigate('/entrar', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      quote={{
        text: 'Recomeçar também faz parte do personagem.',
        author: 'Crossover Cosplay Mart',
        image: '/img/studio/editorial-mood.jpg',
      }}
    >
      <div className="auth__head">
        <p className="eyebrow">Nova senha</p>
        <h1 className="display auth__title">Escolha uma senha nova.</h1>
      </div>
      <form className="auth__form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="reset-pass">Nova senha</label>
          <input id="reset-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="reset-confirm">Confirme a nova senha</label>
          <input id="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <p className="auth__error">{error}</p>}
        {!token && <p className="auth__error">Link inválido. Solicite a recuperação novamente.</p>}
        <button className="btn btn--block" disabled={loading || !token}>
          <span>{loading ? 'Salvando…' : 'Redefinir senha'}</span>
        </button>
      </form>
    </AuthShell>
  );
}
