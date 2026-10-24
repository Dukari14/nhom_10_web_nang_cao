import { useEffect, useState } from 'react';
import { Alert, Badge, Breadcrumb, Button, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ErrorAlert from '../components/ErrorAlert';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { getErrorMessages, isCanceled } from '../utils/errors';
import { formatPrice, getDisplayName, getPriceInfo } from '../utils/format';
import useDocumentTitle from '../utils/useDocumentTitle';

// config_description do admin nhập, các mục cách nhau bằng dấu ";"
// Ví dụ: "Màn hình 6.2 inch; Chip Exynos 2400; Camera sau 50MP; Pin 4000 mAh"
const CONFIG_LABELS = ['Màn hình', 'Chip', 'Camera sau', 'Camera trước', 'Camera', 'Pin', 'Hệ điều hành'];

function parseConfig(text) {
    if (!text) return [];
    return text
        .split(/[;\n]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const label = CONFIG_LABELS.find((item) => part.toLowerCase().startsWith(`${item.toLowerCase()} `));
            if (label) return { label, value: part.slice(label.length).trim() };
            const colon = part.indexOf(':');
            if (colon > 0) return { label: part.slice(0, colon).trim(), value: part.slice(colon + 1).trim() };
            return { label: 'Khác', value: part };
        });
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [notice, setNotice] = useState('');

    useDocumentTitle(product ? getDisplayName(product) : 'Chi tiết sản phẩm');

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setErrors([]);
        setNotice('');
        setQuantity(1);
        api.get(`/products/${id}`, { signal: controller.signal })
            .then((response) => {
                setProduct(response.data);
                setLoading(false);
            })
            .catch((error) => {
                if (isCanceled(error)) return;
                setProduct(null);
                setErrors(getErrorMessages(error));
                setLoading(false);
            });
        return () => controller.abort();
    }, [id]);

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang tải sản phẩm...</span>
                </Spinner>
            </Container>
        );
    }

    if (!product) {
        return (
            <Container className="py-4">
                <ErrorAlert messages={errors} />
                <Button as={Link} to="/products" variant="outline-primary">
                    Về danh sách điện thoại
                </Button>
            </Container>
        );
    }

    const price = getPriceInfo(product);
    const soldOut = product.stock <= 0;
    const maxQuantity = Math.max(1, product.stock);
    const configRows = parseConfig(product.config_description);

    const changeQuantity = (value) => {
        const number = Math.floor(Number(value));
        if (Number.isNaN(number)) return;
        setQuantity(Math.min(maxQuantity, Math.max(1, number)));
    };

    // Giỏ hàng làm ở bước sau: chưa đăng nhập thì chuyển sang đăng nhập, đã đăng nhập thì báo "Sắp có"
    const handleAddToCart = () => {
        if (!user) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setNotice('Chức năng giỏ hàng sắp có. Bạn vui lòng quay lại sau nhé!');
    };

    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: 'small' }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
                    Trang chủ
                </Breadcrumb.Item>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/products' }}>
                    Điện thoại
                </Breadcrumb.Item>
                {product.brand && (
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/products?brand=${encodeURIComponent(product.brand)}` }}>
                        {product.brand}
                    </Breadcrumb.Item>
                )}
                <Breadcrumb.Item active>{getDisplayName(product)}</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="g-4">
                <Col md={6}>
                    <ProductImage product={product} size="lg" />
                </Col>

                <Col md={6} className="d-flex flex-column gap-3">
                    <h1 className="fs-3 fw-bold mb-0">{getDisplayName(product)}</h1>
                    <div className="text-secondary">
                        {product.brand && <>Thương hiệu: {product.brand} · </>}
                        {soldOut ? (
                            <Badge bg="dark">Hết hàng</Badge>
                        ) : (
                            <span>Còn hàng ({product.stock})</span>
                        )}
                    </div>

                    <div>
                        <span className="price-current price-large">{formatPrice(price.current)}</span>{' '}
                        {price.hasDiscount && (
                            <>
                                <span className="price-original fs-6">{formatPrice(price.original)}</span>{' '}
                                <Badge bg="danger">-{price.discountPercent}%</Badge>
                            </>
                        )}
                    </div>

                    {product.storage && (
                        <div>
                            <h2 className="fs-6 fw-bold">Dung lượng</h2>
                            <span className="spec-chip">{product.storage}</span>
                        </div>
                    )}
                    {product.color && (
                        <div>
                            <h2 className="fs-6 fw-bold">Màu sắc</h2>
                            <span className="spec-chip">{product.color}</span>
                        </div>
                    )}

                    <Form.Group controlId="quantity" className="d-flex align-items-center gap-3">
                        <Form.Label className="fw-bold mb-0">Số lượng</Form.Label>
                        <Form.Control
                            type="number"
                            min={1}
                            max={maxQuantity}
                            value={quantity}
                            disabled={soldOut}
                            style={{ width: 90 }}
                            onChange={(event) => changeQuantity(event.target.value)}
                        />
                    </Form.Group>

                    <div className="d-flex flex-column flex-sm-row gap-2">
                        <Button variant="primary" size="lg" className="flex-grow-1" disabled={soldOut} onClick={handleAddToCart}>
                            Thêm vào giỏ hàng
                        </Button>
                        <Button variant="outline-primary" size="lg" className="flex-grow-1" disabled={soldOut} onClick={handleAddToCart}>
                            Mua ngay
                        </Button>
                    </div>

                    {notice && (
                        <Alert variant="info" dismissible onClose={() => setNotice('')} className="mb-0">
                            {notice}
                        </Alert>
                    )}
                </Col>
            </Row>

            <section className="mt-4" aria-labelledby="config-title">
                <h2 id="config-title" className="fs-5 fw-bold">
                    Cấu hình chi tiết
                </h2>
                <Table responsive className="spec-table">
                    <tbody>
                        {product.brand && (
                            <tr>
                                <th scope="row">Hãng</th>
                                <td>{product.brand}</td>
                            </tr>
                        )}
                        {product.ram && (
                            <tr>
                                <th scope="row">RAM</th>
                                <td>{product.ram}</td>
                            </tr>
                        )}
                        {product.storage && (
                            <tr>
                                <th scope="row">Bộ nhớ trong</th>
                                <td>{product.storage}</td>
                            </tr>
                        )}
                        {product.color && (
                            <tr>
                                <th scope="row">Màu sắc</th>
                                <td>{product.color}</td>
                            </tr>
                        )}
                        {configRows.map((row, index) => (
                            <tr key={`${row.label}-${index}`}>
                                <th scope="row">{row.label}</th>
                                <td>{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {product.description && <p className="text-secondary">{product.description}</p>}
            </section>
        </Container>
    );
}
