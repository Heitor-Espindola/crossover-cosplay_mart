import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetailPage } from './pages/ProductDetail';
import { CollectionDetail, CollectionsIndex } from './pages/Collections';
import { LoadoutPage } from './pages/Loadout';
import { CartPage } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { ForgotPassword, Login, Register, ResetPassword } from './pages/Auth';
import {
  AccountAddresses,
  AccountFavorites,
  AccountLayout,
  AccountLoadouts,
  AccountOrders,
  AccountOverview,
  AccountProfile,
} from './pages/Account';
import { About, Contact, Help } from './pages/About';
import { AdminCustomers, AdminDashboard, AdminLayout, AdminOrders, AdminProducts, AdminReviews } from './pages/Admin';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="loja" element={<Shop />} />
        <Route path="produto/:slug" element={<ProductDetailPage />} />
        <Route path="colecoes" element={<CollectionsIndex />} />
        <Route path="colecoes/:slug" element={<CollectionDetail />} />
        <Route path="loadout" element={<LoadoutPage />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="sobre" element={<About />} />
        <Route path="ajuda" element={<Help />} />
        <Route path="contato" element={<Contact />} />

        <Route path="entrar" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        <Route path="recuperar-senha" element={<ForgotPassword />} />
        <Route path="redefinir-senha" element={<ResetPassword />} />

        <Route path="conta" element={<AccountLayout />}>
          <Route index element={<AccountOverview />} />
          <Route path="pedidos" element={<AccountOrders />} />
          <Route path="favoritos" element={<AccountFavorites />} />
          <Route path="loadouts" element={<AccountLoadouts />} />
          <Route path="enderecos" element={<AccountAddresses />} />
          <Route path="dados" element={<AccountProfile />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="produtos" element={<AdminProducts />} />
          <Route path="avaliacoes" element={<AdminReviews />} />
          <Route path="clientes" element={<AdminCustomers />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
