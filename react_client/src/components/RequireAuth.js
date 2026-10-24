import { Container, Spinner } from 'react-bootstrap';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Bọc các trang cần đăng nhập. Chưa đăng nhập thì chuyển sang /login,
// đăng nhập xong sẽ quay lại đúng trang đang định vào (state.from).
export default function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang kiểm tra phiên đăng nhập...</span>
                </Spinner>
            </Container>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
}
