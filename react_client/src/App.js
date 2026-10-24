import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomeScreenPage from './web-users/homescreen/HomeScreenPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AuthPage from './pages/AuthPage';
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
                <Route
                    path="/cart"
                    element={<ComingSoonPage title="Giỏ hàng" message="Chức năng giỏ hàng sắp có." />}
                />
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
