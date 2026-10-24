import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../api';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import { getErrorMessages, isCanceled } from '../../utils/errors';

const LATEST_LIMIT = 8;

// Mục "Điện thoại mới nhất" lấy dữ liệu thật từ GET /products/latest
export default function HomeScreenContent() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    const load = useCallback((signal) => {
        setLoading(true);
        setErrors([]);
        return api
            .get('/products/latest', { params: { limit: LATEST_LIMIT }, signal })
            .then((response) => setProducts(response.data))
            .catch((error) => {
                if (!isCanceled(error)) setErrors(getErrorMessages(error));
            })
            .finally(() => {
                if (!signal || !signal.aborted) setLoading(false);
            });
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);
        return () => controller.abort();
    }, [load]);

    return (
        <Container as="section" className="py-4" aria-labelledby="latest-title">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 id="latest-title" className="fs-4 fw-bold mb-0">
                    Điện thoại mới nhất
                </h2>
                <Link to="/products" className="fw-semibold">
                    Xem tất cả
                </Link>
            </div>

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Đang tải sản phẩm...</span>
                    </Spinner>
                </div>
            )}

            {!loading && errors.length > 0 && (
                <>
                    <ErrorAlert messages={errors} />
                    <Button variant="outline-primary" onClick={() => load()}>
                        Thử lại
                    </Button>
                </>
            )}

            {!loading && errors.length === 0 && products.length === 0 && (
                <EmptyState message="Hiện chưa có sản phẩm nào." />
            )}

            {!loading && products.length > 0 && (
                <Row xs={2} md={3} lg={4} className="g-3">
                    {products.map((product) => (
                        <Col key={product.product_id}>
                            <ProductCard product={product} />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}
