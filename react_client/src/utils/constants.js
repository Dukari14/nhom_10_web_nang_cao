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
