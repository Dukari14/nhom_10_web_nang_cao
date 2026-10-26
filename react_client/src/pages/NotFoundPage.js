import { Alert, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function NotFoundPage() {
    useDocumentTitle('Không tìm thấy trang');

    return (
        <Container className="py-5">
            <h1 className="fs-3 fw-bold">Không tìm thấy trang</h1>
            <Alert variant="warning">Đường dẫn bạn truy cập không tồn tại.</Alert>
            <Button as={Link} to="/" variant="outline-primary">
                Về trang chủ
            </Button>
        </Container>
    );
}
