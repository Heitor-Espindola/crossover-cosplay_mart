export type Category = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  sortOrder: number;
  productCount?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection: string;
  price: number;
  comparePrice: number | null;
  shortDescription: string;
  description: string;
  details: string;
  specs: Record<string, string>;
  images: string[];
  sizes: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  badge: string | null;
};

export type Review = {
  id: number;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  productName?: string;
};

export type ProductDetail = Product & { related: Product[]; reviews: Review[] };

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string | null;
  cpf?: string | null;
  createdAt?: string;
};

export type Address = {
  id: number;
  label: string;
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Record<string, string>;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: 'credit_card' | 'boleto' | 'pix';
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
};

export type Loadout = { id: number; name: string; items: { productId: string; size: string; quantity: number }[]; createdAt: string };

export type ShippingOption = { id: string; name: string; carrier: string; eta: string; price: number };
export type ShippingResult = { cep: string; state: string; city: string | null; street: string; district: string; options: ShippingOption[] };

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(data?.error || 'Algo deu errado. Tente novamente.', res.status);
  return data as T;
}

const qs = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== 'todos') s.set(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
};

export const api = {
  categories: () => request<Category[]>('/categories'),
  products: (params: Record<string, string | undefined> = {}) => request<Product[]>(`/products${qs(params)}`),
  product: (slug: string) => request<ProductDetail>(`/products/${slug}`),
  suggestions: (q: string) =>
    request<{ products: Product[]; categories: Category[]; collections: string[] }>(`/search/suggestions?q=${encodeURIComponent(q)}`),
  shipping: (cep: string) => request<ShippingResult>(`/shipping/${encodeURIComponent(cep)}`),

  register: (name: string, email: string, password: string) =>
    request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User | null }>('/auth/me'),
  forgot: (email: string) => request<{ ok: boolean; message: string; demoToken: string | null }>('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  reset: (token: string, password: string) => request<{ ok: boolean }>('/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),

  updateAccount: (body: Partial<{ name: string; phone: string; cpf: string }>) => request<{ user: User }>('/account', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/account/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  addresses: () => request<Address[]>('/account/addresses'),
  addAddress: (body: Omit<Address, 'id' | 'isDefault' | 'recipient'>) =>
    request<Address>('/account/addresses', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress: (id: number, body: Partial<Address>) =>
    request<Address>(`/account/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  removeAddress: (id: number) => request<{ ok: boolean }>(`/account/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id: number) => request<{ ok: boolean }>(`/account/addresses/${id}/default`, { method: 'POST' }),

  favorites: () => request<Product[]>('/favorites'),
  toggleFavorite: (productId: string) => request<{ favorited: boolean }>(`/favorites/${productId}`, { method: 'POST' }),

  loadouts: () => request<Loadout[]>('/loadouts'),
  saveLoadout: (name: string, items: Loadout['items']) => request<Loadout>('/loadouts', { method: 'POST', body: JSON.stringify({ name, items }) }),
  deleteLoadout: (id: number) => request<{ ok: boolean }>(`/loadouts/${id}`, { method: 'DELETE' }),

  createOrder: (body: unknown) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  orders: () => request<Order[]>('/orders'),
  order: (id: string) => request<Order>(`/orders/${id}`),
  review: (productId: string, body: { rating: number; title: string; body: string; author?: string }) =>
    request<{ ok: boolean; message: string }>(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),

  admin: {
    stats: () => request<AdminStats>('/admin/stats'),
    products: () => request<Product[]>('/admin/products'),
    createProduct: (body: Partial<Product>) => request<Product>('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
    updateProduct: (id: string, body: Partial<Product>) => request<Product>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteProduct: (id: string) => request<{ ok: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }),
    createCategory: (body: Partial<Category>) => request<{ ok: boolean }>('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
    orders: () => request<Order[]>('/admin/orders'),
    updateOrder: (id: string, body: { status?: string; paymentStatus?: string }) => request<Order>(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    customers: () => request<{ id: number; name: string; email: string; phone: string | null; created_at: string; orders: number; spent: number }[]>('/admin/customers'),
    reviews: () => request<Review[]>('/admin/reviews'),
    moderateReview: (id: number, status: 'approved' | 'rejected' | 'pending') => request<{ ok: boolean }>(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
};

export type AdminStats = {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  lowStock: number;
  pendingReviews: number;
  byCategory: { name: string; products: number; revenue: number }[];
  recent: Order[];
  topProducts: { name: string; id: string; sold: number; revenue: number }[];
  monthly: { month: string; orders: number; revenue: number }[];
};
