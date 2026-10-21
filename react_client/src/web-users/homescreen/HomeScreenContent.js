import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './css/HomeScreenContent.css';

const API_URL = 'http://localhost:3000/api/products/latest?limit=8';

// Dữ liệu dự phòng khi API lỗi (để xem giao diện)
const FALLBACK_PRODUCTS = [
    { product_id: 1, name: 'Xiaomi 14 Pro', slug: 'xiaomi-14-pro', price: 19990000, sale_price: 17490000, stock: 12, image_url: null, created_at: new Date().toISOString() },
    { product_id: 2, name: 'Redmi Note 13', slug: 'redmi-note-13', price: 5990000, sale_price: null, stock: 30, image_url: null, created_at: new Date().toISOString() },
    { product_id: 3, name: 'Xiaomi Pad 6', slug: 'xiaomi-pad-6', price: 9490000, sale_price: 8290000, stock: 0, image_url: null, created_at: new Date().toISOString() },
    { product_id: 4, name: 'Mi Band 8', slug: 'mi-band-8', price: 990000, sale_price: null, stock: 55, image_url: null, created_at: new Date().toISOString() },
    { product_id: 5, name: 'Xiaomi 14 Pro', slug: 'xiaomi-14-pro', price: 19990000, sale_price: 17490000, stock: 12, image_url: null, created_at: new Date().toISOString() },
    { product_id: 6, name: 'Xiaomi 14 Pro', slug: 'xiaomi-14-pro', price: 19990000, sale_price: 17490000, stock: 12, image_url: null, created_at: new Date().toISOString() },
    { product_id: 7, name: 'Xiaomi 14 Pro', slug: 'xiaomi-14-pro', price: 19990000, sale_price: 17490000, stock: 12, image_url: null, created_at: new Date().toISOString() },
    { product_id: 8, name: 'Xiaomi 14 Pro', slug: 'xiaomi-14-pro', price: 19990000, sale_price: 17490000, stock: 3, image_url: null, created_at: new Date().toISOString() },
];

const NEW_WITHIN_DAYS = 14;

const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const getDiscountPercent = (price, salePrice) => {
    if (!salePrice || Number(salePrice) >= Number(price)) return 0;
    return Math.round((1 - Number(salePrice) / Number(price)) * 100);
};

const isNewProduct = (createdAt) => {
    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= NEW_WITHIN_DAYS;
};

function ProductCard({ product }) {
    const { name, slug, price, sale_price, stock, image_url, created_at } = product;
    const discount = getDiscountPercent(price, sale_price);
    const soldOut = stock <= 0;
    const lowStock = stock > 0 && stock <= 5;

    return (
        <article className={`product-card ${soldOut ? 'is-sold-out' : ''}`}>
            <a href={`/san-pham/${slug}`} className="product-card__link">
                <div className="product-card__media">
                    {image_url ? (
                        <img src={image_url} alt={name} loading="lazy" />
                    ) : (
                        <span className="product-card__placeholder" aria-hidden="true">
                            {name.charAt(0)}
                        </span>
                    )}

                    <div className="product-card__badges">
                        {isNewProduct(created_at) && <span className="badge badge--new">Mới</span>}
                        {discount > 0 && <span className="badge badge--sale">-{discount}%</span>}
                    </div>

                    {soldOut && <div className="product-card__overlay">Hết hàng</div>}
                </div>

                <div className="product-card__body">
                    <h3 className="product-card__name">{name}</h3>

                    <div className="product-card__price">
                        {discount > 0 ? (
                            <>
                                <span className="price price--current">{formatPrice(sale_price)}</span>
                                <span className="price price--old">{formatPrice(price)}</span>
                            </>
                        ) : (
                            <span className="price price--current">{formatPrice(price)}</span>
                        )}
                    </div>

                    {lowStock && <p className="product-card__stock">Chỉ còn {stock} sản phẩm</p>}
                </div>
            </a>
        </article>
    );
}

function ProductSkeleton() {
    return (
        <div className="product-card product-card--skeleton" aria-hidden="true">
            <div className="product-card__media skeleton" />
            <div className="product-card__body">
                <div className="skeleton skeleton--line" />
                <div className="skeleton skeleton--line skeleton--short" />
            </div>
        </div>
    );
}

export default function HomeScreenContent() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Carousel: ref tới khung cuộn + trạng thái bật/tắt 2 nút
    const trackRef = useRef(null);
    const [canScroll, setCanScroll] = useState({ left: false, right: false });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(API_URL);
                setProducts(response.data);
            } catch (err) {
                console.error('Lỗi khi fetch dữ liệu:', err);
                setError(true);
                setProducts(FALLBACK_PRODUCTS);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Kiểm tra còn chỗ để cuộn sang trái / phải hay không
    const updateArrows = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanScroll({
            left: el.scrollLeft > 4,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
        });
    }, []);

    // Tính lại khi dữ liệu thay đổi hoặc khi đổi kích thước cửa sổ
    useEffect(() => {
        updateArrows();
        window.addEventListener('resize', updateArrows);
        return () => window.removeEventListener('resize', updateArrows);
    }, [products, loading, updateArrows]);

    // Bấm nút: cuộn mượt đúng một "trang" (bằng chiều rộng khung nhìn)
    const scrollByPage = (direction) => {
        const el = trackRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
    };

    return (
        <main className="content">
            <h1>Sản Phẩm mới nhất</h1>

            {error && (
                <p className="content__notice" role="status">
                    Không tải được dữ liệu từ máy chủ, đang hiển thị dữ liệu mẫu.
                </p>
            )}

            <div className="carousel">
                <button
                    type="button"
                    className="carousel__btn carousel__btn--prev"
                    onClick={() => scrollByPage(-1)}
                    disabled={!canScroll.left}
                    aria-label="Xem sản phẩm trước"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <section
                    className="carousel__track"
                    ref={trackRef}
                    onScroll={updateArrows}
                    aria-busy={loading}
                >
                    {loading
                        ? Array.from({ length: 8 }, (_, i) => <ProductSkeleton key={i} />)
                        : products.map((product) => (
                              <ProductCard key={product.product_id} product={product} />
                          ))}
                </section>

                <button
                    type="button"
                    className="carousel__btn carousel__btn--next"
                    onClick={() => scrollByPage(1)}
                    disabled={!canScroll.right}
                    aria-label="Xem sản phẩm tiếp theo"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {!loading && products.length === 0 && (
                <p className="content__empty">Chưa có sản phẩm nào. Hãy quay lại sau nhé.</p>
            )}
        </main>
    );
}