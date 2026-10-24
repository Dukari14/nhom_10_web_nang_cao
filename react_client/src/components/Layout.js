import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AppNavbar from './AppNavbar';
import AppFooter from './AppFooter';

// Khung chung: thanh điều hướng, nội dung từng trang, chân trang
export default function Layout() {
    const { pathname } = useLocation();

    // Chuyển trang thì cuộn lên đầu
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="d-flex flex-column min-vh-100">
            <AppNavbar />
            <main className="flex-grow-1 d-flex flex-column">
                <Outlet />
            </main>
            <AppFooter />
        </div>
    );
}
