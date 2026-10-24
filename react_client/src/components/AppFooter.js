import { Container } from 'react-bootstrap';

export default function AppFooter() {
    return (
        <footer className="site-footer mt-auto py-3">
            <Container className="d-flex flex-column flex-md-row justify-content-between gap-1">
                <span>© 2026 PhoneShop - Nhóm 10</span>
                <span>Chính sách bảo hành · Liên hệ · Điều khoản</span>
            </Container>
        </footer>
    );
}
