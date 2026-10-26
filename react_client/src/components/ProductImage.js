import { useEffect, useState } from 'react';
import { getDisplayName, getInitial } from '../utils/format';

// Ảnh sản phẩm; chưa có ảnh hoặc ảnh lỗi thì hiện khung xám với chữ cái đầu của tên
export default function ProductImage({ product, size = 'sm' }) {
    const [failed, setFailed] = useState(false);

    // Đổi sang sản phẩm khác thì thử tải ảnh lại
    useEffect(() => {
        setFailed(false);
    }, [product.image_url]);

    return (
        <div className={`product-image product-image-${size}`}>
            {product.image_url && !failed ? (
                <img
                    src={product.image_url}
                    alt={getDisplayName(product)}
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span aria-hidden="true">{getInitial(product)}</span>
            )}
        </div>
    );
}
