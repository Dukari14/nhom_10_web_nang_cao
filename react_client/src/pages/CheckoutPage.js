import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { DEMO_BANK_ACCOUNT, PAYMENT_METHOD_LABELS } from '../utils/constants';
import { getErrorMessages } from '../utils/errors';
import { formatPrice, getDisplayName } from '../utils/format';
import { normalizePhone, validateCheckout } from '../utils/validation';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items, itemCount, totalAmount, loaded, loadErrors, refresh } = useCart();
    const [values, setValues] = useState({ shipping_address: '', phone: '', payment_method: 'COD' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverErrors, setServerErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    useDocumentTitle('Thanh toán');

    // Tải lại giỏ để tổng tiền và tồn kho đúng với database
    useEffect(() => {
        refresh();
    }, [refresh]);

    const set = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = validateCheckout(values);
        setFieldErrors(errors);
        setServerErrors([]);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        try {
            const response = await api.post('/orders', {
                shipping_address: values.shipping_address.trim(),
                phone: normalizePhone(values.phone),
                payment_method: values.payment_method,
            });
            // Server đã xóa giỏ khi tạo đơn, tải lại để Navbar về 0
            await refresh();
            navigate(`/orders/${response.data.order_id}`, { replace: true, state: { justOrdered: true } });
        } catch (error) {
            setServerErrors(getErrorMessages(error));
            // Có thể tồn kho đã đổi, cập nhật lại giỏ
            refresh();
            setSubmitting(false);
        }
    };

    if (!loaded && loadErrors.length === 0) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang tải giỏ hàng...</span>
                </Spinner>
            </Container>
        );
    }

    if (!loaded) {
        return (
            <Container className="py-4">
                <ErrorAlert messages={loadErrors} />
                <Button variant="outline-primary" onClick={refresh}>
                    Thử lại
                </Button>
            </Container>
        );
    }

    if (items.length === 0) {
        return (
            <Container className="py-4">
                <h1 className="fs-3 fw-bold mb-3">Thanh toán</h1>
                <ErrorAlert messages={serverErrors} />
                <EmptyState message="Giỏ hàng của bạn đang trống nên chưa thể đặt hàng." actionLabel="Xem điện thoại" to="/products" />
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="fs-3 fw-bold mb-3">Thanh toán</h1>
            <ErrorAlert messages={serverErrors} onClose={() => setServerErrors([])} />

            <Form noValidate onSubmit={handleSubmit}>
                <Row className="g-4">
                    <Col lg={8} className="d-flex flex-column gap-3">
                        <Card>
                            <Card.Body>
                                <h2 className="fs-5 fw-bold mb-3">1. Thông tin giao hàng</h2>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group controlId="checkout-name">
                                            <Form.Label className="fw-semibold">Họ và tên</Form.Label>
                                            <Form.Control type="text" value={user.full_name || user.email} readOnly />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="checkout-phone">
                                            <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                value={values.phone}
                                                placeholder="09xx xxx xxx"
                                                autoComplete="tel"
                                                isInvalid={Boolean(fieldErrors.phone)}
                                                onChange={set('phone')}
                                            />
                                            <Form.Control.Feedback type="invalid">{fieldErrors.phone}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Group controlId="checkout-address">
                                            <Form.Label className="fw-semibold">Địa chỉ nhận hàng</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={values.shipping_address}
                                                maxLength={255}
                                                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                                                autoComplete="street-address"
                                                isInvalid={Boolean(fieldErrors.shipping_address)}
                                                onChange={set('shipping_address')}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {fieldErrors.shipping_address}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Body>
                                <fieldset>
                                    <legend className="fs-5 fw-bold mb-3">2. Phương thức thanh toán</legend>
                                    {Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => (
                                        <Form.Check
                                            key={method}
                                            type="radio"
                                            id={`pay-${method}`}
                                            name="payment_method"
                                            label={label}
                                            value={method}
                                            checked={values.payment_method === method}
                                            onChange={set('payment_method')}
                                        />
                                    ))}
                                </fieldset>

                                {values.payment_method === 'BANK_TRANSFER' && (
                                    <Alert variant="info" className="mt-3 mb-0">
                                        <p className="fw-semibold mb-1">Thông tin chuyển khoản</p>
                                        <div>Ngân hàng: {DEMO_BANK_ACCOUNT.bank}</div>
                                        <div>Số tài khoản: {DEMO_BANK_ACCOUNT.number}</div>
                                        <div>Chủ tài khoản: {DEMO_BANK_ACCOUNT.owner}</div>
                                        <div>Số tiền: {formatPrice(totalAmount)}</div>
                                        <div>Nội dung: mã đơn hàng (hiện sau khi bạn đặt hàng)</div>
                                        <p className="small text-secondary mt-2 mb-0">
                                            Đây là thông tin minh họa, không phải tài khoản thật. Đơn hàng được ghi nhận ở trạng
                                            thái "Chưa thanh toán".
                                        </p>
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <Card>
                            <Card.Body className="d-flex flex-column gap-2">
                                <h2 className="fs-5 fw-bold">Đơn hàng của bạn</h2>
                                {items.map((item) => (
                                    <div key={item.cart_item_id} className="d-flex justify-content-between gap-3">
                                        <span>
                                            {getDisplayName(item.product)} × {item.quantity}
                                        </span>
                                        <span className="text-nowrap">{formatPrice(item.line_total)}</span>
                                    </div>
                                ))}
                                <div className="d-flex justify-content-between">
                                    <span>Phí vận chuyển</span>
                                    <span>Miễn phí</span>
                                </div>
                                <div className="d-flex justify-content-between border-top pt-2 fw-bold">
                                    <span>Tổng cộng ({itemCount} sản phẩm)</span>
                                    <span className="price-current">{formatPrice(totalAmount)}</span>
                                </div>
                                <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                                    {submitting ? (
                                        <Spinner size="sm" animation="border" role="status" aria-label="Đang đặt hàng" />
                                    ) : (
                                        'Xác nhận đặt hàng'
                                    )}
                                </Button>
                                <Link to="/cart" className="text-center text-decoration-none">
                                    Quay lại giỏ hàng
                                </Link>
                                <div className="text-secondary small">
                                    Bằng việc đặt hàng, bạn đồng ý với điều khoản của cửa hàng.
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}
