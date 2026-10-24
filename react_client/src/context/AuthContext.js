import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

// Giữ trạng thái đăng nhập. Token nằm trong cookie httpOnly do server quản lý,
// nên mỗi lần tải trang chỉ cần hỏi GET /auth/me để biết phiên còn hiệu lực không.
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        api.get('/auth/me')
            .then((response) => active && setUser(response.data))
            .catch(() => active && setUser(null)) // 401 = chưa đăng nhập, không phải lỗi
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const login = useCallback(async (email, password) => {
        await api.post('/auth/login', { email, password });
        const response = await api.get('/auth/me');
        setUser(response.data);
        return response.data;
    }, []);

    // Server không tự đăng nhập sau khi đăng ký nên gọi login ngay để người dùng đỡ thao tác
    const register = useCallback(
        async ({ email, password, full_name }) => {
            await api.post('/auth/register', { email, password, full_name });
            return login(email, password);
        },
        [login],
    );

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được dùng bên trong AuthProvider');
    }
    return context;
}
