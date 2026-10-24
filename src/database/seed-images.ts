// Ảnh sản phẩm mẫu nằm ở react_client/public/images/products, frontend (cổng 3001) phục vụ trực tiếp
// nên chỉ cần lưu đường dẫn tương đối. Khóa là tên sản phẩm trong seed: "<model> <dung lượng>".
export const IMAGE_BASE_PATH = '/images/products';

export const SEED_IMAGES: Record<string, string> = {
  'Galaxy S24 256GB': '256GBgalaxy-s24-den-.webp',
  'Galaxy S24 Ultra 512GB': 'ultraGalaxy-s24-512GB.webp',
  'Galaxy A55 128GB': 'samsung-galaxy-a55-128GB-xanh.webp',
  'Galaxy Z Flip5 256GB': 'samsung-galaxy-z-flip-5-256gb-tim.webp',
  'iPhone 15 128GB': 'iphone-15-128gn-hong.webp',
  'iPhone 15 Pro Max 256GB': 'iphone15-pro-max-256gb-titan-tu-nhien.webp',
  'iPhone 14 128GB': 'iPhone-14-128GB-trang.webp',
  'iPhone 13 128GB': 'iPhone-13-128GB-den.webp',
  'Xiaomi 14 256GB': 'Xiaomi-14-256GB-trang.webp',
  'Xiaomi 14T Pro 512GB': 'Xiaomi-14T-Pro-512GB-den.webp',
  'Redmi Note 13 128GB': 'Redmi-Note-13-128GB-xanh.webp',
  'Redmi 13C 128GB': 'Redmi-13C-128GB-xanh.webp',
  'Reno11 F 5G 256GB': 'Reno11-F-5G-256GB-xanh.webp',
  'Find X7 Ultra 512GB': 'Find-X7-Ultra-512GB-nau.webp',
  'A79 5G 128GB': 'A79-5G-128GB-tim.png',
  'V30e 256GB': 'V30e-256GB-tim.png',
  'Y36 128GB': 'Y36-128GB-den.webp',
  'X100 Pro 512GB': 'X100-Pro-512GB-xanh.webp',
  'Realme 12 Pro+ 256GB': 'Realme-12-Pro+-256GB-nau.webp',
  'Realme C67 256GB': 'Realme-C67-256GB-xanh.webp',
};

// Đường dẫn lưu vào cột image_url, hoặc null nếu sản phẩm chưa có ảnh
export function seedImageUrl(productName: string): string | null {
  const file = SEED_IMAGES[productName];
  return file ? `${IMAGE_BASE_PATH}/${file}` : null;
}
