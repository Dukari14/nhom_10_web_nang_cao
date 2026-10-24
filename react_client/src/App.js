import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomeScreenPage from './web-users/homescreen/HomeScreenPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AuthPage from './pages/AuthPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import RequireAuth from './components/RequireAuth';
import ComingSoonPage from './pages/ComingSoonPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<HomeScreenPage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
                <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
                <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
                <Route
                    path="/admin"
                    element={
                        <ComingSoonPage
                            title="Trang quản trị"
                            message="Trang quản trị sẽ được hoàn thiện ở bước tiếp theo."
                            adminOnly
                        />
                    }
                />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
