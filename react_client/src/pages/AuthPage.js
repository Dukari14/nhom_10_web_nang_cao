import { useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import ErrorAlert from '../components/ErrorAlert';
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

// Điều hướng sau khi đăng nhập: admin vào /admin, khách quay lại trang đang xem
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

function LoginForm({ autoFocus }) {
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
        try {
            afterLogin(await login(values.email.trim(), values.password));
        } catch (error) {
            setServerErrors(getErrorMessages(error));
            setSubmitting(false);
        }
    };

    return (
        <Card className="h-100">
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
                        placeholder="email@vidu.com"
                        autoComplete="email"
                        autoFocus={autoFocus}
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
                <p className="text-secondary small mt-3 mb-0">
                    Tài khoản quản trị dùng chung form này; hệ thống tự chuyển đến trang quản lý.
                </p>
            </Card.Body>
        </Card>
    );
}

function RegisterForm({ autoFocus }) {
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
        try {
            afterLogin(
                await register({
                    full_name: values.full_name.trim(),
                    email: values.email.trim(),
                    password: values.password,
                }),
            );
        } catch (error) {
            setServerErrors(getErrorMessages(error));
            setSubmitting(false);
        }
    };

    return (
        <Card className="h-100">
            <Card.Body className="p-4">
                <h2 className="fs-4 fw-bold mb-3">Tạo tài khoản</h2>
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
                        autoFocus={autoFocus}
                    />
                    <Field
                        id="register-email"
                        label="Email"
                        type="email"
                        value={values.email}
                        onChange={set('email')}
                        error={fieldErrors.email}
                        placeholder="email@vidu.com"
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
            </Card.Body>
        </Card>
    );
}

// Hai route /login và /register dùng chung một trang có cả hai form (theo wireframe);
// mode quyết định ô nhập nào được focus sẵn.
export default function AuthPage({ mode }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    useDocumentTitle(mode === 'register' ? 'Đăng ký' : 'Đăng nhập');

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang kiểm tra phiên đăng nhập...</span>
                </Spinner>
            </Container>
        );
    }

    // Đã đăng nhập thì không cần ở lại trang này
    if (user) {
        const from = location.state && location.state.from;
        return <Navigate to={user.role === 'admin' ? '/admin' : from || '/'} replace />;
    }

    return (
        <div className="auth-page flex-grow-1 py-4 py-md-5">
            <Container>
                <Row className="g-4 justify-content-center">
                    <Col md={6} lg={5}>
                        <LoginForm autoFocus={mode !== 'register'} />
                    </Col>
                    <Col md={6} lg={5}>
                        <RegisterForm autoFocus={mode === 'register'} />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
