import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import StatusBadge from './StatusBadge';
import { formatPrice, getDisplayName, getPriceInfo, getSpecLine, isNewProduct } from '../utils/format';

export default function ProductCard({ product }) {
    const price = getPriceInfo(product);
    const soldOut = product.stock <= 0;
    const lowStock = product.stock > 0 && product.stock <= 5;
    const spec = getSpecLine(product);

    return (
        <Card className={`product-card h-100 ${soldOut ? 'is-sold-out' : ''}`}>
            <Link to={`/products/${product.product_id}`} className="d-flex flex-column h-100">
                <Card.Body className="d-flex flex-column gap-2 p-3">
                    <div className="position-relative">
                        <ProductImage product={product} size="sm" />
                        <div className="position-absolute top-0 start-0 m-2 d-flex align-items-start gap-1">
                            {isNewProduct(product) && <StatusBadge tone="green">Mới</StatusBadge>}
                            {price.hasDiscount && <span className="discount-tag">-{price.discountPercent}%</span>}
                        </div>
                        {soldOut && (
                            <StatusBadge tone="dark" className="position-absolute bottom-0 end-0 m-2">
                                Hết hàng
                            </StatusBadge>
                        )}
                    </div>
                    <Card.Title as="h3" className="product-name mb-0">
                        {getDisplayName(product)}
                    </Card.Title>
                    {spec && <Card.Text className="text-secondary small mb-0">{spec}</Card.Text>}
                    <div className="mt-auto">
                        <span className={`price-current ${price.hasDiscount ? 'is-sale' : ''}`}>
                            {formatPrice(price.current)}
                        </span>{' '}
                        {price.hasDiscount && <span className="price-original">{formatPrice(price.original)}</span>}
                        {lowStock && <div className="text-danger small">Chỉ còn {product.stock} sản phẩm</div>}
                    </div>
                </Card.Body>
            </Link>
        </Card>
    );
}
