import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../utils/useDocumentTitle';

// Trang tạm cho các chức năng làm ở bước sau (giỏ hàng, quản trị)
export default function ComingSoonPage({ title, message, adminOnly = false }) {
    const { user, loading } = useAuth();
    useDocumentTitle(title);

    if (adminOnly) {
        if (loading) {
            return (
                <Container className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Đang kiểm tra quyền truy cập...</span>
                    </Spinner>
                </Container>
            );
        }
        if (!user || user.role !== 'admin') {
            return <Navigate to={user ? '/' : '/login'} replace />;
        }
    }

    return (
        <Container className="py-5">
            <h1 className="fs-3 fw-bold">{title}</h1>
            <Alert variant="info">{message}</Alert>
            <Button as={Link} to="/" variant="outline-primary">
                Về trang chủ
            </Button>
        </Container>
    );
}
