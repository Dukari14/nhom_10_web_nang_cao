import { Container } from 'react-bootstrap';

export default function AppFooter() {
    return (
        <footer className="site-footer mt-auto py-3">
            <Container className="d-flex flex-column flex-md-row justify-content-between gap-2">
                <span>© 2026 PhoneShop - Nhóm 10 - Ảnh sản phẩm được lấy trên Internet </span>
                <span className="d-flex flex-wrap gap-3">
                    <span>Chính sách bảo hành</span>
                    <span>Liên hệ</span>
                    <span>Điều khoản</span>
                </span>
            </Container>
        </footer>
    );
}
