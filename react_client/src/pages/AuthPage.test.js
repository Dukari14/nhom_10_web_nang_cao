import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AuthPage from './AuthPage';
import { useAuth } from '../context/AuthContext';

// Không gọi API thật: giả lập trạng thái đăng nhập và hàm xử lý lỗi
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../utils/errors', () => ({ getErrorMessages: () => ['Lỗi giả lập từ server'] }));

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="from">{location.state && location.state.from ? location.state.from : 'khong-co'}</div>;
}

function renderAt(entry) {
    return render(
        <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <>
                            <AuthPage mode="login" />
                            <LocationProbe />
                        </>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <>
                            <AuthPage mode="register" />
                            <LocationProbe />
                        </>
                    }
                />
                <Route path="/" element={<div>Trang chu gia</div>} />
                <Route path="/products/1" element={<div>Trang san pham gia</div>} />
                <Route path="/admin" element={<div>Trang quan tri gia</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

const loggedOut = (extra = {}) => ({ user: null, loading: false, login: jest.fn(), register: jest.fn(), ...extra });

beforeEach(() => {
    useAuth.mockReturnValue(loggedOut());
});

describe('trang /login', () => {
    test('chỉ có một form đăng nhập kèm liên kết sang đăng ký', () => {
        const { container } = renderAt('/login');

        expect(container.querySelectorAll('form')).toHaveLength(1);
        expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Tạo tài khoản' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Họ và tên')).not.toBeInTheDocument();
        expect(screen.getByText(/Chưa có tài khoản\?/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/register');
    });

    test('tiêu đề tab riêng', () => {
        renderAt('/login');
        expect(document.title).toBe('Đăng nhập | PhoneShop');
    });
});

describe('trang /register', () => {
    test('chỉ có một form đăng ký kèm liên kết sang đăng nhập', () => {
        const { container } = renderAt('/register');

        expect(container.querySelectorAll('form')).toHaveLength(1);
        expect(screen.getByRole('heading', { name: 'Tạo tài khoản' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Họ và tên')).toBeInTheDocument();
        expect(screen.getByText(/Đã có tài khoản\?/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    });

    test('tiêu đề tab riêng', () => {
        renderAt('/register');
        expect(document.title).toBe('Đăng ký | PhoneShop');
    });
});

describe('chuyển giữa hai trang', () => {
    test('giữ tham số quay lại (state.from)', () => {
        renderAt({ pathname: '/login', state: { from: '/products/1' } });
        expect(screen.getByTestId('from')).toHaveTextContent('/products/1');

        userEvent.click(screen.getByRole('link', { name: 'Đăng ký' }));
        expect(screen.getByRole('heading', { name: 'Tạo tài khoản' })).toBeInTheDocument();
        expect(screen.getByTestId('from')).toHaveTextContent('/products/1');

        userEvent.click(screen.getByRole('link', { name: 'Đăng nhập' }));
        expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
        expect(screen.getByTestId('from')).toHaveTextContent('/products/1');
    });

    test('xóa nội dung ô nhập và thông báo lỗi cũ khi chuyển trang', () => {
        renderAt('/login');
        userEvent.type(screen.getByLabelText('Email'), 'sai-email');
        userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
        expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();

        userEvent.click(screen.getByRole('link', { name: 'Đăng ký' }));
        userEvent.click(screen.getByRole('link', { name: 'Đăng nhập' }));

        expect(screen.getByLabelText('Email')).toHaveValue('');
        expect(screen.queryByText('Email không hợp lệ')).not.toBeInTheDocument();
    });
});

describe('chuyển hướng', () => {
    test('đã đăng nhập mà vào /login hoặc /register thì về trang chủ', () => {
        useAuth.mockReturnValue(loggedOut({ user: { user_id: 'u1', role: 'customer' } }));

        renderAt('/login');
        expect(screen.getByText('Trang chu gia')).toBeInTheDocument();
    });

    test('đã đăng nhập (kể cả admin) vào /register cũng về trang chủ', () => {
        useAuth.mockReturnValue(loggedOut({ user: { user_id: 'a1', role: 'admin' } }));

        renderAt('/register');
        expect(screen.getByText('Trang chu gia')).toBeInTheDocument();
    });

    test('đăng nhập xong quay lại trang đang xem trước đó', async () => {
        const login = jest.fn().mockResolvedValue({ role: 'customer' });
        useAuth.mockReturnValue(loggedOut({ login }));
        renderAt({ pathname: '/login', state: { from: '/products/1' } });

        userEvent.type(screen.getByLabelText('Email'), 'a@test.com');
        userEvent.type(screen.getByLabelText('Mật khẩu'), 'matkhau123');
        userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        await waitFor(() => expect(screen.getByText('Trang san pham gia')).toBeInTheDocument());
        expect(login).toHaveBeenCalledWith('a@test.com', 'matkhau123');
    });

    test('admin đăng nhập xong vào /admin', async () => {
        const login = jest.fn().mockResolvedValue({ role: 'admin' });
        useAuth.mockReturnValue(loggedOut({ login }));
        renderAt({ pathname: '/login', state: { from: '/products/1' } });

        userEvent.type(screen.getByLabelText('Email'), 'admin@test.com');
        userEvent.type(screen.getByLabelText('Mật khẩu'), 'matkhau123');
        userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        await waitFor(() => expect(screen.getByText('Trang quan tri gia')).toBeInTheDocument());
    });

    test('đăng ký thành công vào trang chủ', async () => {
        const register = jest.fn().mockResolvedValue({ role: 'customer' });
        useAuth.mockReturnValue(loggedOut({ register }));
        renderAt('/register');

        userEvent.type(screen.getByLabelText('Họ và tên'), 'Nguyen Van A');
        userEvent.type(screen.getByLabelText('Email'), 'a@test.com');
        userEvent.type(screen.getByLabelText('Mật khẩu (tối thiểu 8 ký tự)'), 'matkhau123');
        userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

        await waitFor(() => expect(screen.getByText('Trang chu gia')).toBeInTheDocument());
        expect(register).toHaveBeenCalledWith({ full_name: 'Nguyen Van A', email: 'a@test.com', password: 'matkhau123' });
    });

    test('đăng nhập sai hiện lỗi từ server và ở lại trang', async () => {
        const login = jest.fn().mockRejectedValue(new Error('sai'));
        useAuth.mockReturnValue(loggedOut({ login }));
        renderAt('/login');

        userEvent.type(screen.getByLabelText('Email'), 'a@test.com');
        userEvent.type(screen.getByLabelText('Mật khẩu'), 'matkhau123');
        userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        expect(await screen.findByText('Lỗi giả lập từ server')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    });
});
