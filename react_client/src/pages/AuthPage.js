import { useRef, useState } from 'react';
import { Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ErrorAlert from '../components/ErrorAlert';
import PageSpinner from '../components/PageSpinner';
import { useAuth } from '../context/AuthContext';
import { getErrorMessages } from '../utils/errors';
import useDocumentTitle from '../utils/useDocumentTitle';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin({ email, password }) {
    const errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Email không hợp lệ';
    if (!password) errors.password = 'Vui lòng nhập mật khẩu';
    return errors;
}

function validateRegister({ full_name, email, password }) {
    const errors = {};
    if (!full_name.trim()) errors.full_name = 'Họ và tên không được để trống';
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Email không hợp lệ';
    if (password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    return errors;
}

// Điều hướng sau khi đăng nhập: admin vào /admin, khách quay lại trang đang xem (state.from)
function useAfterLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    return (user) => {
        const from = location.state && location.state.from;
        navigate(user.role === 'admin' ? '/admin' : from || '/', { replace: true });
    };
}

function Field({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, autoFocus, help }) {
    return (
        <Form.Group controlId={id} className="mb-3">
            <Form.Label className="fw-semibold">{label}</Form.Label>
            <Form.Control
                type={type}
                value={value}
                placeholder={placeholder}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                isInvalid={Boolean(error)}
                onChange={(event) => onChange(event.target.value)}
            />
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
            {help && !error && <Form.Text muted>{help}</Form.Text>}
        </Form.Group>
    );
}

// Liên kết sang trang còn lại, giữ nguyên state.from để đăng nhập xong vẫn quay về trang đang xem
function SwitchLink({ question, label, to }) {
    const location = useLocation();
    return (
        <p className="text-center mt-3 mb-0">
            {question}{' '}
            <Link to={to} state={location.state} className="fw-semibold">
                {label}
            </Link>
        </p>
    );
}

// attemptRef cho AuthPage biết form đang tự xử lý đăng nhập, để không chuyển hướng chen ngang
function LoginForm({ attemptRef }) {
    const { login } = useAuth();
    const afterLogin = useAfterLogin();
    const [values, setValues] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverErrors, setServerErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const set = (key) => (value) => setValues((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = validateLogin(values);
        setFieldErrors(errors);
        setServerErrors([]);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        attemptRef.current = true;
        try {
            afterLogin(await login(values.email.trim(), values.password));
        } catch (error) {
            attemptRef.current = false;
            setServerErrors(getErrorMessages(error));
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <Card.Body className="p-4">
                <h1 className="fs-4 fw-bold mb-3">Đăng nhập</h1>
                <ErrorAlert messages={serverErrors} onClose={() => setServerErrors([])} />
                <Form noValidate onSubmit={handleSubmit}>
                    <Field
                        id="login-email"
                        label="Email"
                        type="email"
                        value={values.email}
                        onChange={set('email')}
                        error={fieldErrors.email}
                        placeholder="email@example.com"
                        autoComplete="email"
                        autoFocus
                    />
                    <Field
                        id="login-password"
                        label="Mật khẩu"
                        type="password"
                        value={values.password}
                        onChange={set('password')}
                        error={fieldErrors.password}
                        placeholder="Mật khẩu"
                        autoComplete="current-password"
                    />
                    <Button type="submit" variant="primary" size="lg" className="w-100" disabled={submitting}>
                        {submitting ? <Spinner size="sm" animation="border" role="status" aria-label="Đang đăng nhập" /> : 'Đăng nhập'}
                    </Button>
                </Form>
                <SwitchLink question="Chưa có tài khoản?" label="Đăng ký" to="/register" />
            </Card.Body>
        </Card>
    );
}

function RegisterForm({ attemptRef }) {
    const { register } = useAuth();
    const afterLogin = useAfterLogin();
    const [values, setValues] = useState({ full_name: '', email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverErrors, setServerErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const set = (key) => (value) => setValues((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = validateRegister(values);
        setFieldErrors(errors);
        setServerErrors([]);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        attemptRef.current = true;
        try {
            afterLogin(
                await register({
                    full_name: values.full_name.trim(),
                    email: values.email.trim(),
                    password: values.password,
                }),
            );
        } catch (error) {
            attemptRef.current = false;
            setServerErrors(getErrorMessages(error));
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <Card.Body className="p-4">
                <h1 className="fs-4 fw-bold mb-3">Tạo tài khoản</h1>
                <ErrorAlert messages={serverErrors} onClose={() => setServerErrors([])} />
                <Form noValidate onSubmit={handleSubmit}>
                    <Field
                        id="register-name"
                        label="Họ và tên"
                        value={values.full_name}
                        onChange={set('full_name')}
                        error={fieldErrors.full_name}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        autoFocus
                    />
                    <Field
                        id="register-email"
                        label="Email"
                        type="email"
                        value={values.email}
                        onChange={set('email')}
                        error={fieldErrors.email}
                        placeholder="email@example.com"
                        autoComplete="email"
                    />
                    <Field
                        id="register-password"
                        label="Mật khẩu (tối thiểu 8 ký tự)"
                        type="password"
                        value={values.password}
                        onChange={set('password')}
                        error={fieldErrors.password}
                        placeholder="Mật khẩu"
                        autoComplete="new-password"
                    />
                    <Button type="submit" variant="primary" size="lg" className="w-100" disabled={submitting}>
                        {submitting ? <Spinner size="sm" animation="border" role="status" aria-label="Đang đăng ký" /> : 'Đăng ký'}
                    </Button>
                </Form>
                <SwitchLink question="Đã có tài khoản?" label="Đăng nhập" to="/login" />
            </Card.Body>
        </Card>
    );
}

// /login chỉ có form đăng nhập, /register chỉ có form đăng ký (mode quyết định form nào hiện).
export default function AuthPage({ mode }) {
    const { user, loading } = useAuth();
    const attemptRef = useRef(false);
    const isRegister = mode === 'register';
    useDocumentTitle(isRegister ? 'Đăng ký' : 'Đăng nhập');

    if (loading) {
        return <PageSpinner label="Đang kiểm tra phiên đăng nhập..." />;
    }

    if (user) {
        // Vừa đăng nhập hoặc đăng ký xong bằng form này: để form tự chuyển về trang đang xem hoặc /admin
        if (attemptRef.current) return <PageSpinner label="Đang chuyển trang..." />;
        // Đã đăng nhập từ trước mà vào /login hay /register thì về trang chủ
        return <Navigate to="/" replace />;
    }

    // key theo mode: chuyển giữa hai trang thì form được dựng lại, ô nhập và thông báo lỗi cũ bị xóa
    return (
        <div className="auth-page flex-grow-1 d-flex align-items-center py-4 py-md-5">
            <Container className="auth-container">
                {isRegister ? (
                    <RegisterForm key="register" attemptRef={attemptRef} />
                ) : (
                    <LoginForm key="login" attemptRef={attemptRef} />
                )}
            </Container>
        </div>
    );
}
