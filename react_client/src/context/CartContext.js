import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';
import { getErrorMessages } from '../utils/errors';

const CartContext = createContext(null);

// Giữ giỏ hàng của người đang đăng nhập để Navbar, trang giỏ hàng và trang thanh toán dùng chung.
// Mỗi thao tác thêm/sửa/xóa đều nhận lại giỏ mới từ server nên số lượng luôn khớp với database.
export function CartProvider({ children }) {
    const { user } = useAuth();
    const userId = user ? user.user_id : null;
    const [cart, setCart] = useState(null);
    const [loadErrors, setLoadErrors] = useState([]);

    const refresh = useCallback(async () => {
        setLoadErrors([]);
        try {
            const response = await api.get('/cart');
            setCart(response.data);
        } catch (error) {
            setLoadErrors(getErrorMessages(error));
        }
    }, []);

    // Đăng nhập thì tải giỏ, đăng xuất thì xóa giỏ khỏi bộ nhớ
    useEffect(() => {
        if (userId) {
            refresh();
        } else {
            setCart(null);
            setLoadErrors([]);
        }
    }, [userId, refresh]);

    // Các hàm dưới đây ném lỗi ra để nơi gọi tự hiển thị thông báo
    const addItem = useCallback(async (productId, quantity) => {
        const response = await api.post('/cart/items', { productId, quantity });
        setCart(response.data);
        return response.data;
    }, []);

    const updateItem = useCallback(async (itemId, quantity) => {
        const response = await api.patch(`/cart/items/${itemId}`, { quantity });
        setCart(response.data);
        return response.data;
    }, []);

    const removeItem = useCallback(async (itemId) => {
        const response = await api.delete(`/cart/items/${itemId}`);
        setCart(response.data);
        return response.data;
    }, []);

    const value = useMemo(
        () => ({
            cart,
            items: cart ? cart.items : [],
            itemCount: cart ? cart.total_quantity : 0,
            totalAmount: cart ? cart.total_amount : 0,
            loaded: cart !== null,
            loadErrors,
            refresh,
            addItem,
            updateItem,
            removeItem,
        }),
        [cart, loadErrors, refresh, addItem, updateItem, removeItem],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart phải được dùng bên trong CartProvider');
    }
    return context;
}
