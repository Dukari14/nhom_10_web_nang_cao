import { useEffect, useState } from 'react';
import { Button, Container, Nav, NavDropdown, Navbar } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { brandFromCategory } from '../utils/format';

export default function AppNavbar() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [brands, setBrands] = useState([]);

    // Thương hiệu lấy từ danh mục thật; lỗi thì chỉ ẩn menu thương hiệu
    useEffect(() => {
        let active = true;
        api.get('/categories')
            .then((response) => active && setBrands(response.data.map(brandFromCategory)))
            .catch(() => active && setBrands([]));
        return () => {
            active = false;
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate('/');
        }
    };

    return (
        <Navbar expand="lg" variant="dark" className="app-navbar" collapseOnSelect>
            <Container>
                <Navbar.Brand as={Link} to="/">
                    PhoneShop
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-menu" aria-label="Mở menu" />
                <Navbar.Collapse id="main-menu">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/" end>
                            Trang chủ
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/products" end>
                            Điện thoại
                        </Nav.Link>
                        {brands.length > 0 && (
                            <NavDropdown title="Thương hiệu" id="brand-menu">
                                {brands.map((brand) => (
                                    <NavDropdown.Item key={brand} as={Link} to={`/products?brand=${encodeURIComponent(brand)}`}>
                                        {brand}
                                    </NavDropdown.Item>
                                ))}
                            </NavDropdown>
                        )}
                    </Nav>
                    <Nav className="align-items-lg-center gap-2">
                        <Nav.Link as={NavLink} to="/cart">
                            Giỏ hàng
                        </Nav.Link>
                        {!loading &&
                            (user ? (
                                <>
                                    <Navbar.Text className="text-white">
                                        Xin chào, {user.full_name || user.email}
                                    </Navbar.Text>
                                    <Button variant="outline-light" size="sm" onClick={handleLogout}>
                                        Đăng xuất
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button as={Link} to="/register" variant="outline-light" size="sm">
                                        Đăng ký
                                    </Button>
                                    <Button as={Link} to="/login" variant="primary" size="sm">
                                        Đăng nhập
                                    </Button>
                                </>
                            ))}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
