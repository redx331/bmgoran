import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { trackPixel } from './lib/pixel';
import { useRouter } from './lib/router';
import { AdminPage } from './pages/AdminPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContactPage } from './pages/ContactPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductPage } from './pages/ProductPage';
import { ShopPage } from './pages/ShopPage';

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function AppRoutes() {
  const { path } = useRouter();

  if (path === '/') return <HomePage />;
  if (path === '/shop') return <ShopPage />;
  if (path === '/delivery') return <DeliveryPage />;
  if (path === '/contact') return <ContactPage />;

  const productMatch = path.match(/^\/product\/([^/]+)$/);
  if (productMatch?.[1]) {
    const slug = safeDecode(productMatch[1]);
    if (!slug) return <NotFoundPage />;
    return <ProductPage key={slug} slug={slug} />;
  }

  const checkoutMatch = path.match(/^\/checkout\/([^/]+)$/);
  if (checkoutMatch?.[1]) {
    const slug = safeDecode(checkoutMatch[1]);
    if (!slug) return <NotFoundPage />;
    return <CheckoutPage key={slug} slug={slug} />;
  }

  return <NotFoundPage />;
}

export function App() {
  const { path } = useRouter();

  useEffect(() => {
    if (path !== '/admin') trackPixel('PageView');
  }, [path]);

  // The admin area is standalone: no storefront header, footer or demo bar.
  if (path === '/admin') return <AdminPage />;

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}
