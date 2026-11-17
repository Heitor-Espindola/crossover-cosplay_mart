const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatBRL = (value: number) => brl.format(value || 0);

export const formatDate = (value: string) => {
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
};

export const formatShortDate = (value: string) => {
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

export const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

export const formatPhone = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

export const formatCPF = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const discountPercent = (price: number, compare: number | null) =>
  compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;

export const stockLabel = (stock: number) => {
  if (stock <= 0) return { label: 'Esgotado', tone: 'out' as const };
  if (stock <= 5) return { label: `Últimas ${stock} unidades`, tone: 'low' as const };
  if (stock <= 15) return { label: 'Em estoque — poucas unidades', tone: 'mid' as const };
  return { label: 'Pronta entrega', tone: 'ok' as const };
};

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Aguardando pagamento', tone: 'amber' },
  paid: { label: 'Pagamento aprovado', tone: 'green' },
  preparing: { label: 'Em preparação', tone: 'blue' },
  shipped: { label: 'Enviado', tone: 'blue' },
  delivered: { label: 'Entregue', tone: 'green' },
  cancelled: { label: 'Cancelado', tone: 'red' },
};

export const PAYMENT_LABEL: Record<string, string> = {
  credit_card: 'Cartão de crédito (simulado)',
  boleto: 'Boleto bancário (simulado)',
  pix: 'Pix (simulado)',
};
