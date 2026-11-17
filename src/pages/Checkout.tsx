import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Order, type ShippingOption, type ShippingResult } from '../lib/api';
import { formatBRL, formatCEP, formatPhone, formatCPF } from '../lib/format';
import { useAuth, useCart, useToast } from '../context/AppContext';
import { IconArrow, IconArrowLeft, IconCheck, IconLock, IconTruck } from '../components/icons';
import './checkout.css';

const STEPS = ['Informações', 'Entrega', 'Pagamento', 'Revisão'];

type Info = { name: string; email: string; phone: string; cpf: string };
type Address = { cep: string; street: string; number: string; complement: string; district: string; city: string; state: string };
type Errors = Record<string, string>;

export function Checkout() {
  const { lines, subtotal, clear, count } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<Info>({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', cpf: user?.cpf || '' });
  const [address, setAddress] = useState<Address>({ cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' });
  const [shipping, setShipping] = useState<ShippingResult | null>(null);
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(null);
  const [payment, setPayment] = useState<'credit_card' | 'boleto' | 'pix' | ''>('');
  const [card, setCard] = useState({ holder: '', last4: '', expiry: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      api
        .addresses()
        .then((list) => {
          const def = list.find((a) => a.isDefault) || list[0];
          if (def) {
            setAddress({
              cep: def.cep,
              street: def.street,
              number: def.number,
              complement: def.complement,
              district: def.district,
              city: def.city,
              state: def.state,
            });
            lookupCep(def.cep);
          }
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (lines.length === 0 && !placed) navigate('/loja', { replace: true });
  }, [lines.length, placed, navigate]);

  const shippingCost = shippingOption?.price || 0;
  const total = subtotal + shippingCost;

  const validateInfo = () => {
    const e: Errors = {};
    if (info.name.trim().length < 3) e.name = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) e.email = 'Informe um e-mail válido.';
    if (info.phone.replace(/\D/g, '').length < 10) e.phone = 'Informe um telefone com DDD.';
    if (info.cpf && info.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF incompleto.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAddress = () => {
    const e: Errors = {};
    if (address.cep.replace(/\D/g, '').length !== 8) e.cep = 'Informe um CEP válido.';
    if (!address.street.trim()) e.street = 'Informe a rua.';
    if (!address.number.trim()) e.number = 'Informe o número.';
    if (!address.city.trim()) e.city = 'Informe a cidade.';
    if (!address.state.trim()) e.state = 'Informe o estado.';
    if (!shippingOption) e.shipping = 'Escolha uma forma de entrega.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const lookupCep = async (raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await api.shipping(clean);
      setShipping(res);
      setAddress((a) => ({
        ...a,
        cep: res.cep,
        street: res.street || a.street,
        district: res.district || a.district,
        city: res.city || a.city,
        state: res.state || a.state,
      }));
      setShippingOption(null);
    } catch (err) {
      notify({ tone: 'error', title: 'CEP não encontrado', message: (err as Error).message });
    } finally {
      setLoadingCep(false);
    }
  };

  const next = () => {
    if (step === 0 && !validateInfo()) return;
    if (step === 1 && !validateAddress()) return;
    if (step === 2) {
      if (!payment) {
        setErrors({ payment: 'Escolha uma forma de pagamento.' });
        return;
      }
      if (payment === 'credit_card' && (!card.holder.trim() || card.last4.replace(/\D/g, '').length !== 4)) {
        setErrors({ card: 'Preencha o nome do titular e os 4 últimos dígitos (simulação).' });
        return;
      }
    }
    setErrors({});
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        customer: info,
        shippingAddress: address,
        shippingMethod: shippingOption?.name || 'Entrega padrão',
        shippingCost,
        paymentMethod: payment,
        items: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
      });
      setPlaced(order);
      clear();
    } catch (err) {
      notify({ tone: 'error', title: 'Não foi possível finalizar', message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) return <OrderSuccess order={placed} />;

  return (
    <div className="checkout">
      <div className="container">
        <header className="checkout__head">
          <div>
            <p className="eyebrow">Checkout seguro</p>
            <h1 className="display checkout__title">Finalizar pedido</h1>
          </div>
          <Link to="/loja" className="link-underline">
            <IconArrowLeft size={14} /> Continuar comprando
          </Link>
        </header>

        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s} className={`${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>
              <button onClick={() => i < step && setStep(i)} disabled={i > step}>
                <span className="stepper__num">{i < step ? <IconCheck size={12} /> : `0${i + 1}`}</span>
                {s}
              </button>
            </li>
          ))}
        </ol>

        <div className="checkout__grid">
          <div className="checkout__main">
            {step === 0 && (
              <section className="co-card">
                <h2 className="co-card__title">Quem está vestindo?</h2>
                <p className="co-card__sub">Usamos esses dados apenas para enviar seu pedido e os avisos de entrega.</p>
                <div className="form-grid">
                  <div className="field span-2">
                    <label htmlFor="co-name">Nome completo</label>
                    <input id="co-name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} aria-invalid={!!errors.name} />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="co-email">E-mail</label>
                    <input id="co-email" type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} aria-invalid={!!errors.email} />
                    {errors.email && <span className="error">{errors.email}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="co-phone">Telefone</label>
                    <input id="co-phone" value={info.phone} onChange={(e) => setInfo({ ...info, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-0000" aria-invalid={!!errors.phone} />
                    {errors.phone && <span className="error">{errors.phone}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="co-cpf">CPF (opcional)</label>
                    <input id="co-cpf" value={info.cpf} onChange={(e) => setInfo({ ...info, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" aria-invalid={!!errors.cpf} />
                    {errors.cpf && <span className="error">{errors.cpf}</span>}
                  </div>
                </div>
                {!user && (
                  <p className="co-card__hint">
                    Já tem conta? <Link to="/entrar?next=/checkout">Entrar</Link> — assim seu pedido fica no histórico.
                  </p>
                )}
                <button className="btn co-next" onClick={next}>
                  <span>Ir para entrega <IconArrow size={16} /></span>
                </button>
              </section>
            )}

            {step === 1 && (
              <section className="co-card">
                <h2 className="co-card__title">Onde entregamos?</h2>
                <p className="co-card__sub">Calculamos o frete pelo CEP, como as transportadoras brasileiras.</p>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="co-cep">CEP</label>
                    <input
                      id="co-cep"
                      value={address.cep}
                      onChange={(e) => {
                        const v = formatCEP(e.target.value);
                        setAddress({ ...address, cep: v });
                        if (v.replace(/\D/g, '').length === 8) lookupCep(v);
                      }}
                      placeholder="00000-000"
                      aria-invalid={!!errors.cep}
                    />
                    {errors.cep && <span className="error">{errors.cep}</span>}
                    {loadingCep && <span className="co-loading">Calculando frete…</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="co-street">Rua / Avenida</label>
                    <input id="co-street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} aria-invalid={!!errors.street} />
                    {errors.street && <span className="error">{errors.street}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="co-number">Número</label>
                    <input id="co-number" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} aria-invalid={!!errors.number} />
                    {errors.number && <span className="error">{errors.number}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="co-compl">Complemento</label>
                    <input id="co-compl" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} placeholder="Apto, bloco, referência" />
                  </div>
                  <div className="field">
                    <label htmlFor="co-district">Bairro</label>
                    <input id="co-district" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="co-city">Cidade</label>
                    <input id="co-city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} aria-invalid={!!errors.city} />
                    {errors.city && <span className="error">{errors.city}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="co-state">Estado</label>
                    <input id="co-state" value={address.state} maxLength={2} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} placeholder="SP" aria-invalid={!!errors.state} />
                    {errors.state && <span className="error">{errors.state}</span>}
                  </div>
                </div>

                <div className="co-shipping">
                  <p className="field-label">Método de entrega</p>
                  {!shipping && <p className="co-loading">Informe o CEP para ver as opções de frete.</p>}
                  {shipping && (
                    <div className="co-shipping__options">
                      {shipping.options.map((o) => (
                        <label key={o.id} className={`ship-option ${shippingOption?.id === o.id ? 'is-active' : ''}`}>
                          <input type="radio" name="ship" checked={shippingOption?.id === o.id} onChange={() => setShippingOption(o)} />
                          <IconTruck size={18} />
                          <span className="ship-option__text">
                            <strong>{o.name}</strong>
                            <em>{o.carrier} · {o.eta}</em>
                          </span>
                          <b>{o.price === 0 ? 'Grátis' : formatBRL(o.price)}</b>
                        </label>
                      ))}
                    </div>
                  )}
                  {errors.shipping && <span className="error">{errors.shipping}</span>}
                  {shipping && shipping.state && (
                    <p className="co-shipping__note">Destino estimado: {shipping.city ? `${shipping.city} — ` : ''}{shipping.state}. Prazos contam após a produção da peça.</p>
                  )}
                </div>

                <div className="co-actions">
                  <button className="co-back" onClick={back}>
                    <IconArrowLeft size={14} /> Voltar
                  </button>
                  <button className="btn" onClick={next}>
                    <span>Ir para pagamento <IconArrow size={16} /></span>
                  </button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="co-card">
                <h2 className="co-card__title">Como você prefere pagar?</h2>
                <p className="co-card__sub">
                  Todos os pagamentos neste protótipo são <strong>simulados</strong>. Nenhum dado de cartão real é
                  solicitado, transmitido ou armazenado.
                </p>
                <div className="pay-options">
                  {(
                    [
                      ['pix', 'Pix', 'Aprovação imediata · 5% de desconto (simulado)'],
                      ['boleto', 'Boleto bancário', 'Vence em 2 dias úteis · simulado'],
                      ['credit_card', 'Cartão de crédito', 'Até 6x sem juros · ambiente simulado'],
                    ] as const
                  ).map(([value, title, desc]) => (
                    <label key={value} className={`pay-option ${payment === value ? 'is-active' : ''}`}>
                      <input type="radio" name="pay" checked={payment === value} onChange={() => setPayment(value)} />
                      <span>
                        <strong>{title}</strong>
                        <em>{desc}</em>
                      </span>
                      <span className={`pay-option__mark pay-option__mark--${value}`}>
                        {value === 'pix' ? 'PIX' : value === 'boleto' ? 'BAR' : 'CARD'}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.payment && <span className="error">{errors.payment}</span>}

                {payment === 'credit_card' && (
                  <div className="pay-card">
                    <p className="eyebrow">Dados simulados do cartão</p>
                    <p className="pay-card__note">
                      Este é um ambiente de demonstração. Digite qualquer titular e os 4 últimos dígitos — nada é
                      processado por uma operadora real.
                    </p>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="card-holder">Nome do titular</label>
                        <input id="card-holder" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} placeholder="Como está no cartão" />
                      </div>
                      <div className="field">
                        <label htmlFor="card-last4">4 últimos dígitos</label>
                        <input id="card-last4" value={card.last4} maxLength={4} onChange={(e) => setCard({ ...card, last4: e.target.value.replace(/\D/g, '') })} placeholder="0000" inputMode="numeric" />
                      </div>
                      <div className="field">
                        <label htmlFor="card-exp">Validade (MM/AA)</label>
                        <input id="card-exp" value={card.expiry} maxLength={5} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="12/28" />
                      </div>
                    </div>
                    {errors.card && <span className="error">{errors.card}</span>}
                  </div>
                )}

                {payment === 'pix' && (
                  <div className="pay-pix">
                    <div className="pay-pix__qr" aria-hidden="true">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <span key={i} className={(i * 7 + (i % 5)) % 3 === 0 ? 'on' : ''} />
                      ))}
                    </div>
                    <p>Um QR Code simulado será gerado após a confirmação do pedido.</p>
                  </div>
                )}

                <div className="co-actions">
                  <button className="co-back" onClick={back}>
                    <IconArrowLeft size={14} /> Voltar
                  </button>
                  <button className="btn" onClick={next}>
                    <span>Revisar pedido <IconArrow size={16} /></span>
                  </button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="co-card">
                <h2 className="co-card__title">Tudo pronto?</h2>
                <p className="co-card__sub">Revise os detalhes — depois é só confirmar.</p>

                <div className="co-review">
                  <div>
                    <p className="eyebrow">Contato</p>
                    <p>{info.name}</p>
                    <p className="co-muted">{info.email} · {info.phone}</p>
                    <button className="co-edit" onClick={() => setStep(0)}>Editar</button>
                  </div>
                  <div>
                    <p className="eyebrow">Entrega</p>
                    <p>{address.street}, {address.number}{address.complement ? ` — ${address.complement}` : ''}</p>
                    <p className="co-muted">{address.district} · {address.city} — {address.state} · CEP {address.cep}</p>
                    <p className="co-muted">{shippingOption?.name} ({shippingOption?.carrier})</p>
                    <button className="co-edit" onClick={() => setStep(1)}>Editar</button>
                  </div>
                  <div>
                    <p className="eyebrow">Pagamento</p>
                    <p>
                      {payment === 'pix' ? 'Pix (simulado)' : payment === 'boleto' ? 'Boleto bancário (simulado)' : `Cartão terminando em ${card.last4} (simulado)`}
                    </p>
                    <button className="co-edit" onClick={() => setStep(2)}>Editar</button>
                  </div>
                </div>

                <ul className="co-review__items">
                  {lines.map((l) => (
                    <li key={l.key}>
                      <img src={l.image} alt="" />
                      <span>
                        <strong>{l.name}</strong>
                        <em>Tam. {l.size} · {l.quantity}x</em>
                      </span>
                      <b>{formatBRL(l.price * l.quantity)}</b>
                    </li>
                  ))}
                </ul>

                <div className="co-actions">
                  <button className="co-back" onClick={back}>
                    <IconArrowLeft size={14} /> Voltar
                  </button>
                  <button className="btn btn--burgundy" onClick={placeOrder} disabled={submitting}>
                    <span>
                      <IconLock size={15} /> {submitting ? 'Confirmando…' : `Confirmar pedido · ${formatBRL(total)}`}
                    </span>
                  </button>
                </div>
                <p className="co-terms">Ao confirmar, você aceita os termos da Crossover. Pagamento simulado — nenhuma cobrança real é feita.</p>
              </section>
            )}
          </div>

          <aside className="co-summary">
            <p className="eyebrow">Resumo · {count} {count === 1 ? 'peça' : 'peças'}</p>
            <ul className="co-summary__items">
              {lines.map((l) => (
                <li key={l.key}>
                  <img src={l.image} alt="" />
                  <span>
                    <strong>{l.name}</strong>
                    <em>Tam. {l.size} · {l.quantity}x</em>
                  </span>
                  <b>{formatBRL(l.price * l.quantity)}</b>
                </li>
              ))}
            </ul>
            <div className="co-summary__rows">
              <div>
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div>
                <span>Frete</span>
                <span>{shippingOption ? (shippingOption.price === 0 ? 'Grátis' : formatBRL(shippingOption.price)) : 'A calcular'}</span>
              </div>
              {subtotal >= 499 && shippingOption && shippingOption.price > 0 && (
                <div className="co-summary__discount">
                  <span>Frete grátis (pedido acima de R$ 499)</span>
                  <span>-{formatBRL(shippingOption.price)}</span>
                </div>
              )}
            </div>
            <div className="co-summary__total">
              <span>Total</span>
              <strong>{formatBRL(subtotal >= 499 && shippingOption && shippingOption.price > 0 ? subtotal : total)}</strong>
            </div>
            <p className="co-summary__secure">
              <IconLock size={13} /> Compra protegida · Pagamento simulado
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function OrderSuccess({ order }: { order: Order }) {
  return (
    <div className="order-success">
      <div className="container order-success__inner">
        <div className="order-success__mark">
          <IconCheck size={30} />
        </div>
        <p className="eyebrow">Pedido confirmado</p>
        <h1 className="display order-success__title">
          O personagem está a <em className="serif-italic">caminho</em>.
        </h1>
        <p className="order-success__sub">
          Recebemos seu pedido <strong>{order.id}</strong>. Você vai receber um e-mail com o acompanhamento (simulado) em{' '}
          {order.customerEmail}.
        </p>

        <div className="order-success__card">
          <div>
            <p className="eyebrow">Pagamento</p>
            <p>
              {order.paymentMethod === 'pix' ? 'Pix' : order.paymentMethod === 'boleto' ? 'Boleto bancário' : 'Cartão de crédito'}{' '}
              — <em>simulado</em>
            </p>
          </div>
          <div>
            <p className="eyebrow">Entrega</p>
            <p>{order.shippingMethod}</p>
          </div>
          <div>
            <p className="eyebrow">Total</p>
            <p>{formatBRL(order.total)}</p>
          </div>
        </div>

        <ul className="order-success__items">
          {order.items.map((i) => (
            <li key={i.productId}>
              <img src={i.image} alt="" />
              <span>
                <strong>{i.name}</strong>
                <em>Tam. {i.size} · {i.quantity}x</em>
              </span>
              <b>{formatBRL(i.unitPrice * i.quantity)}</b>
            </li>
          ))}
        </ul>

        <div className="order-success__ctas">
          <Link to="/conta/pedidos" className="btn">
            <span>Acompanhar pedido</span>
          </Link>
          <Link to="/loja" className="btn btn--ghost">
            <span>Continuar explorando</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
