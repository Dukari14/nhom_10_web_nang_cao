import { useState } from 'react';
import { Button, Nav } from 'react-bootstrap';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MENU = [
    { to: '/admin', label: 'Tổng quan', end: true },
    { to: '/admin/products', label: 'Sản phẩm' },
    { to: '/admin/orders', label: 'Đơn hàng' },
    { to: '/admin/users', label: 'Người dùng' },
];

// Khung khu quản trị: thanh bên xanh đậm ở màn hình rộng, thu gọn thành nút menu trên điện thoại
export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate('/login');
        }
    };

    return (
        <div className="d-lg-flex min-vh-100">
            <aside className="admin-sidebar d-flex flex-column p-3 gap-3">
                <div className="d-flex align-items-center justify-content-between">
                    <Link to="/admin" className="text-white text-decoration-none fw-bold fs-5">
                        PhoneShop Admin
                    </Link>
                    <Button
                        variant="outline-light"
                        size="sm"
                        className="d-lg-none"
                        aria-label={open ? 'Đóng menu quản trị' : 'Mở menu quản trị'}
                        aria-expanded={open}
                        aria-controls="admin-menu"
                        onClick={() => setOpen((value) => !value)}
                    >
                        ☰
                    </Button>
                </div>

                <div id="admin-menu" className={`${open ? 'd-flex' : 'd-none'} d-lg-flex flex-column flex-grow-1 gap-3`}>
                    <Nav className="flex-column gap-1" as="nav" aria-label="Menu quản trị" onClick={() => setOpen(false)}>
                        {MENU.map((item) => (
                            <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.end}>
                                {item.label}
                            </Nav.Link>
                        ))}
                    </Nav>
                    <div className="mt-lg-auto d-flex flex-column gap-2">
                        <div className="small text-white-50">Xin chào, {user.full_name || user.email}</div>
                        <Button as={Link} to="/" variant="outline-light" size="sm">
                            Về trang web
                        </Button>
                        <Button variant="outline-light" size="sm" onClick={handleLogout}>
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </aside>

            <main className="flex-grow-1 p-3 p-lg-4" style={{ minWidth: 0 }}>
                <Outlet />
            </main>
        </div>
    );
}
