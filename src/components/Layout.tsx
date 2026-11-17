import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { Toasts } from './Toasts';
import { ScrollProgress } from './ScrollProgress';
import { Splash } from './Splash';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        // deixa a página montar antes de mirar a âncora
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

export function Layout() {
  useSmoothScroll();

  return (
    <>
      <Splash />
      <ScrollToTop />
      <ScrollProgress />
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Toasts />
    </>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollToTop />
      {children}
      <Toasts />
    </>
  );
}
