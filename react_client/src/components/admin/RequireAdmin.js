import { Container, Spinner } from 'react-bootstrap';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Khu quản trị: chưa đăng nhập về /login, đăng nhập rồi nhưng không phải admin thì về trang chủ.
// Server vẫn kiểm tra quyền ở từng API, đây chỉ là lớp chặn ở giao diện.
export default function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang kiểm tra quyền truy cập...</span>
                </Spinner>
            </Container>
        );
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    if (user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return children;
}
