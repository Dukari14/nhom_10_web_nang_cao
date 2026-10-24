import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import ErrorAlert from '../components/ErrorAlert';
import ProductImage from '../components/ProductImage';
import QuantityInput from '../components/QuantityInput';
import { useCart } from '../context/CartContext';
import { getErrorMessages } from '../utils/errors';
import { formatPrice, getDisplayName, getSpecLine } from '../utils/format';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function CartPage() {
    const navigate = useNavigate();
    const { items, itemCount, totalAmount, loaded, loadErrors, refresh, updateItem, removeItem } = useCart();
    const [busyId, setBusyId] = useState(null);
    const [errors, setErrors] = useState([]);
    useDocumentTitle('Giỏ hàng');

    // Vào trang thì tải lại giỏ để thấy tồn kho mới nhất
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Chạy một thao tác trên một dòng; lỗi từ server (ví dụ vượt tồn kho) hiện ở Alert phía trên
    const run = async (itemId, action) => {
        setBusyId(itemId);
        setErrors([]);
        try {
            await action();
        } catch (error) {
            setErrors(getErrorMessages(error));
            refresh();
        } finally {
            setBusyId(null);
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

    return (
        <Container className="py-4">
            <h1 className="fs-3 fw-bold mb-3">Giỏ hàng của bạn</h1>
            <ErrorAlert messages={errors} onClose={() => setErrors([])} />

            {items.length === 0 ? (
                <Alert variant="info">
                    <p className="mb-2">Giỏ hàng của bạn đang trống.</p>
                    <Button as={Link} to="/products" variant="primary">
                        Xem điện thoại
                    </Button>
                </Alert>
            ) : (
                <Row className="g-4">
                    <Col lg={8}>
                        <ListGroup variant="flush" className="border rounded">
                            {items.map((item) => {
                                const busy = busyId === item.cart_item_id;
                                const spec = getSpecLine(item.product);
                                const soldOut = item.product.stock <= 0;
                                return (
                                    <ListGroup.Item key={item.cart_item_id} className="p-3">
                                        <Row className="g-3 align-items-center">
                                            <Col xs={4} sm={2}>
                                                <ProductImage product={item.product} size="xs" />
                                            </Col>
                                            <Col xs={8} sm={5}>
                                                <Link
                                                    to={`/products/${item.product.product_id}`}
                                                    className="fw-semibold text-decoration-none"
                                                >
                                                    {getDisplayName(item.product)}
                                                </Link>
                                                {spec && <div className="text-secondary small">{spec}</div>}
                                                <div className="small">Đơn giá: {formatPrice(item.unit_price)}</div>
                                                {soldOut && <div className="text-danger small">Sản phẩm đã hết hàng</div>}
                                            </Col>
                                            <Col xs={7} sm={3}>
                                                <QuantityInput
                                                    id={`qty-${item.cart_item_id}`}
                                                    value={item.quantity}
                                                    max={item.product.stock}
                                                    disabled={busy}
                                                    onCommit={(quantity) =>
                                                        run(item.cart_item_id, () => updateItem(item.cart_item_id, quantity))
                                                    }
                                                />
                                                <div className="text-secondary small mt-1">Còn {item.product.stock} sản phẩm</div>
                                            </Col>
                                            <Col xs={5} sm={2} className="text-end">
                                                <div className="price-current">{formatPrice(item.line_total)}</div>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger p-0"
                                                    disabled={busy}
                                                    onClick={() => run(item.cart_item_id, () => removeItem(item.cart_item_id))}
                                                >
                                                    Xóa
                                                </Button>
                                            </Col>
                                        </Row>
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                        <div className="mt-3">
                            <Link to="/products" className="fw-semibold text-decoration-none">
                                ‹ Tiếp tục mua sắm
                            </Link>
                        </div>
                    </Col>

                    <Col lg={4}>
                        <Card className="summary-card">
                            <Card.Body className="d-flex flex-column gap-2">
                                <h2 className="fs-5 fw-bold">Tóm tắt đơn hàng</h2>
                                <div className="d-flex justify-content-between">
                                    <span>Tạm tính ({itemCount} sản phẩm)</span>
                                    <span>{formatPrice(totalAmount)}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Phí vận chuyển</span>
                                    <span>Miễn phí</span>
                                </div>
                                <div className="d-flex justify-content-between border-top pt-2 fw-bold">
                                    <span>Tổng cộng</span>
                                    <span className="price-current">{formatPrice(totalAmount)}</span>
                                </div>
                                <Button variant="primary" size="lg" onClick={() => navigate('/checkout')}>
                                    Thanh toán
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
}
