// Các mức giá dùng chung cho ô tìm kiếm ở trang chủ và bộ lọc ở trang danh sách
export const PRICE_RANGES = [
    { label: 'Mọi mức giá' },
    { label: 'Dưới 5 triệu', max: 5000000 },
    { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
    { label: '10 - 20 triệu', min: 10000000, max: 20000000 },
    { label: 'Trên 20 triệu', min: 20000000 },
];

// Backend chưa có API liệt kê giá trị lọc nên khai báo sẵn theo dữ liệu hiện có
export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB'];
export const COLOR_OPTIONS = ['Đen', 'Trắng', 'Xanh', 'Tím', 'Hồng', 'Nâu', 'Xám', 'Titan tự nhiên'];

export const PAGE_SIZE = 12;

// Nhãn tiếng Việt cho trạng thái đơn hàng và thanh toán (khớp enum của backend)
export const ORDER_STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đang xử lý',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
};

// Thứ tự các bước của một đơn bình thường (đơn bị hủy không nằm trong dãy này)
export const ORDER_STATUS_STEPS = ['pending', 'confirmed', 'shipping', 'delivered'];

export const ORDER_STATUS_VARIANTS = {
    pending: 'warning',
    confirmed: 'info',
    shipping: 'primary',
    delivered: 'success',
    cancelled: 'secondary',
};

export const PAYMENT_STATUS_LABELS = {
    pending: 'Chưa thanh toán',
    completed: 'Đã thanh toán',
    failed: 'Thất bại',
};

export const PAYMENT_STATUS_VARIANTS = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
};

export const PAYMENT_METHOD_LABELS = {
    COD: 'Thanh toán khi nhận hàng (COD)',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
};

// Thông tin tài khoản giả định, chỉ để minh họa giao diện
export const DEMO_BANK_ACCOUNT = {
    bank: 'Ngân hàng Ví Dụ (VDBank)',
    number: '0123 456 789',
    owner: 'CONG TY PHONESHOP',
};
