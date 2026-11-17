import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, type Product, type User } from '../lib/api';

/* ---------------------------------- carrinho --------------------------------- */

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  stock: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, size?: string, quantity?: number) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const lineKey = (productId: string, size: string) => `${productId}::${size}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => read<CartLine[]>('cx_cart', []));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cx_cart', JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((product: Product, size?: string, quantity = 1) => {
    const chosen = size || product.sizes[0] || 'Único';
    setLines((prev) => {
      const key = lineKey(product.id, chosen);
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: Math.min(l.stock, l.quantity + quantity) } : l,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: product.price,
          size: chosen,
          quantity: Math.min(product.stock || 99, quantity),
          stock: product.stock || 99,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(l.stock, quantity)) } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      add,
      remove,
      setQuantity,
      clear,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [lines, add, remove, setQuantity, clear, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de CartProvider');
  return ctx;
}

/* --------------------------------- favoritos -------------------------------- */

type FavoritesContextValue = {
  ids: string[];
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(() => read<string[]>('cx_favorites', []));

  useEffect(() => {
    if (user) {
      api.favorites().then((list) => setIds(list.map((p) => p.id))).catch(() => undefined);
    } else {
      setIds(read<string[]>('cx_favorites', []));
    }
  }, [user]);

  useEffect(() => {
    if (!user) localStorage.setItem('cx_favorites', JSON.stringify(ids));
  }, [ids, user]);

  const toggle = useCallback(
    async (productId: string) => {
      if (user) {
        const res = await api.toggleFavorite(productId);
        setIds((prev) => (res.favorited ? [...prev, productId] : prev.filter((id) => id !== productId)));
      } else {
        setIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
      }
    },
    [user],
  );

  const value = useMemo(() => ({ ids, toggle, has: (id: string) => ids.includes(id) }), [ids, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites precisa estar dentro de FavoritesProvider');
  return ctx;
}

/* -------------------------------- recentes ---------------------------------- */

export function useRecentlyViewed(currentId?: string) {
  const [recent, setRecent] = useState<Product[]>(() => read<Product[]>('cx_recent', []));
  const added = useRef<string | null>(null);

  useEffect(() => {
    if (!currentId || added.current === currentId) return;
    added.current = currentId;
    setRecent((prev) => {
      const next = prev.filter((p) => p.id !== currentId);
      return next.slice(0, 7);
    });
  }, [currentId]);

  const push = useCallback((product: Product) => {
    setRecent((prev) => {
      const next = [product, ...prev.filter((p) => p.id !== product.id)].slice(0, 8);
      localStorage.setItem('cx_recent', JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, push };
}

export const recordRecentlyViewed = (product: Product) => {
  const list = read<Product[]>('cx_recent', []).filter((p) => p.id !== product.id);
  localStorage.setItem('cx_recent', JSON.stringify([product, ...list].slice(0, 8)));
};

export const getRecentlyViewed = () => read<Product[]>('cx_recent', []);

/* ---------------------------------- auth ------------------------------------ */

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.me();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}

/* ------------------------------- notificações ------------------------------- */

export type Toast = { id: number; title: string; message?: string; tone: 'success' | 'error' | 'info' };

type ToastContextValue = { toasts: Toast[]; notify: (t: Omit<Toast, 'id'>) => void; dismiss: (id: number) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4600);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider');
  return ctx;
}
