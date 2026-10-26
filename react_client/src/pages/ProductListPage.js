import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import AppPagination from '../components/AppPagination';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { COLOR_OPTIONS, PAGE_SIZE, PRICE_RANGES, STORAGE_OPTIONS } from '../utils/constants';
import { getErrorMessages, isCanceled } from '../utils/errors';
import { brandFromCategory } from '../utils/format';
import useDocumentTitle from '../utils/useDocumentTitle';

const FILTER_KEYS = ['search', 'brand', 'minPrice', 'maxPrice', 'storage', 'color'];

// Trang danh sách: toàn bộ bộ lọc nằm trong query string nên tải lại trang hoặc gửi link vẫn giữ nguyên kết quả
export default function ProductListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [brands, setBrands] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || '']));
    const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
    const queryKey = searchParams.toString();

    useDocumentTitle(filters.search ? `Kết quả cho "${filters.search}"` : 'Điện thoại');

    // Danh sách hãng lấy từ danh mục thật
    useEffect(() => {
        let active = true;
        api.get('/categories')
            .then((response) => active && setBrands(response.data.map(brandFromCategory)))
            .catch(() => active && setBrands([]));
        return () => {
            active = false;
        };
    }, []);

    // Mỗi lần URL đổi thì tải lại; hủy request cũ nếu người dùng đổi bộ lọc nhanh
    useEffect(() => {
        const controller = new AbortController();
        const params = { page, limit: PAGE_SIZE };
        FILTER_KEYS.forEach((key) => {
            const value = new URLSearchParams(queryKey).get(key);
            if (value) params[key] = value;
        });

        setLoading(true);
        setErrors([]);
        api.get('/products', { params, signal: controller.signal })
            .then((response) => {
                setResult(response.data);
                setLoading(false);
            })
            .catch((error) => {
                if (isCanceled(error)) return;
                setErrors(getErrorMessages(error));
                setResult(null);
                setLoading(false);
            });
        return () => controller.abort();
    }, [queryKey, page]);

    // Đổi bộ lọc thì về trang 1
    const updateParams = (changes) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(changes).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') next.delete(key);
            else next.set(key, String(value));
        });
        next.delete('page');
        setSearchParams(next);
    };

    const goToPage = (target) => {
        const next = new URLSearchParams(searchParams);
        if (target <= 1) next.delete('page');
        else next.set('page', String(target));
        setSearchParams(next);
        window.scrollTo(0, 0);
    };

    const clearFilters = () => setSearchParams(new URLSearchParams());

    const hasFilters = FILTER_KEYS.some((key) => filters[key]);
    const selectedRange = PRICE_RANGES.findIndex(
        (range) => String(range.min || '') === filters.minPrice && String(range.max || '') === filters.maxPrice,
    );

    const total = result ? result.total : 0;

    return (
        <>
            <section className="hero pb-3" aria-label="Tìm kiếm">
                <Container>
                    <SearchBar
                        initialValue={filters.search}
                        onSearch={({ search }) => updateParams({ search })}
                        inputId="list-search"
                    />
                </Container>
            </section>

            <Container className="py-4">
                <Row className="g-4">
                    <Col lg={3} as="aside" aria-label="Bộ lọc">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h2 className="fs-6 fw-bold mb-0">Bộ lọc</h2>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="d-lg-none"
                                aria-expanded={showFilters}
                                aria-controls="filter-panel"
                                onClick={() => setShowFilters((value) => !value)}
                            >
                                {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                            </Button>
                        </div>

                        <div id="filter-panel" className={`${showFilters ? '' : 'd-none'} d-lg-block`}>
                            <fieldset className="mb-3">
                                <legend className="fs-6 fw-bold">Khoảng giá</legend>
                                {PRICE_RANGES.map((range, index) => (
                                    <Form.Check
                                        key={range.label}
                                        type="radio"
                                        id={`price-${index}`}
                                        name="price"
                                        label={range.label}
                                        checked={selectedRange === index}
                                        onChange={() => updateParams({ minPrice: range.min, maxPrice: range.max })}
                                    />
                                ))}
                            </fieldset>

                            <fieldset className="mb-3">
                                <legend className="fs-6 fw-bold">Dung lượng bộ nhớ</legend>
                                <Form.Check
                                    type="radio"
                                    id="storage-all"
                                    name="storage"
                                    label="Tất cả"
                                    checked={!filters.storage}
                                    onChange={() => updateParams({ storage: '' })}
                                />
                                {STORAGE_OPTIONS.map((option) => (
                                    <Form.Check
                                        key={option}
                                        type="radio"
                                        id={`storage-${option}`}
                                        name="storage"
                                        label={option}
                                        checked={filters.storage === option}
                                        onChange={() => updateParams({ storage: option })}
                                    />
                                ))}
                            </fieldset>

                            <fieldset className="mb-3">
                                <legend className="fs-6 fw-bold">Màu sắc</legend>
                                <Form.Check
                                    type="radio"
                                    id="color-all"
                                    name="color"
                                    label="Tất cả"
                                    checked={!filters.color}
                                    onChange={() => updateParams({ color: '' })}
                                />
                                {COLOR_OPTIONS.map((option) => (
                                    <Form.Check
                                        key={option}
                                        type="radio"
                                        id={`color-${option}`}
                                        name="color"
                                        label={option}
                                        checked={filters.color === option}
                                        onChange={() => updateParams({ color: option })}
                                    />
                                ))}
                            </fieldset>

                            {brands.length > 0 && (
                                <fieldset className="mb-3">
                                    <legend className="fs-6 fw-bold">Hãng</legend>
                                    <Form.Check
                                        type="radio"
                                        id="brand-all"
                                        name="brand"
                                        label="Tất cả"
                                        checked={!filters.brand}
                                        onChange={() => updateParams({ brand: '' })}
                                    />
                                    {brands.map((brand) => (
                                        <Form.Check
                                            key={brand}
                                            type="radio"
                                            id={`brand-${brand}`}
                                            name="brand"
                                            label={brand}
                                            checked={filters.brand === brand}
                                            onChange={() => updateParams({ brand })}
                                        />
                                    ))}
                                </fieldset>
                            )}

                            <Button variant="outline-primary" className="w-100" onClick={clearFilters} disabled={!hasFilters}>
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </Col>

                    <Col lg={9}>
                        <h1 className="fs-4 fw-bold mb-3" aria-live="polite">
                            {result && !loading
                                ? `${total} kết quả${filters.search ? ` cho "${filters.search}"` : ''}`
                                : 'Điện thoại'}
                        </h1>

                        <ErrorAlert messages={errors} />

                        {loading && (
                            <div className="text-center py-5">
                                <Spinner animation="border" role="status" variant="primary">
                                    <span className="visually-hidden">Đang tải sản phẩm...</span>
                                </Spinner>
                            </div>
                        )}

                        {!loading && result && result.items.length === 0 && (
                            <EmptyState
                                message="Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại."
                                actionLabel={hasFilters ? 'Xóa bộ lọc' : undefined}
                                onAction={clearFilters}
                            />
                        )}

                        {!loading && result && result.items.length > 0 && (
                            <>
                                <Row xs={1} sm={2} xl={3} className="g-3 mb-4">
                                    {result.items.map((product) => (
                                        <Col key={product.product_id}>
                                            <ProductCard product={product} />
                                        </Col>
                                    ))}
                                </Row>
                                <AppPagination page={result.page} totalPages={result.totalPages} onChange={goToPage} />
                            </>
                        )}
                    </Col>
                </Row>
            </Container>
        </>
    );
}
