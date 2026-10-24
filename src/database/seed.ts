import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './database.provider';
import { User, UserRole } from '../user/user.entity';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';
import { slugify } from '../products/products.service';
import { SALT_ROUNDS } from '../auth/auth.constants';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@phoneshop.vn';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';

const BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'OPPO', 'Vivo', 'Realme'];

interface SeedPhone {
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  price: number;
  sale_price: number | null;
  stock: number;
  config: string;
}

const PHONES: SeedPhone[] = [
  { brand: 'Samsung', model: 'Galaxy S24', ram: '8GB', storage: '256GB', color: 'Đen', price: 22990000, sale_price: 19990000, stock: 12, config: 'Màn hình 6.2 inch Dynamic AMOLED 2X; Chip Exynos 2400; Camera sau 50MP + 12MP + 10MP; Pin 4000 mAh' },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', ram: '12GB', storage: '512GB', color: 'Xám', price: 33990000, sale_price: 31990000, stock: 6, config: 'Màn hình 6.8 inch Dynamic AMOLED 2X; Chip Snapdragon 8 Gen 3; Camera sau 200MP + 50MP + 12MP + 10MP; Pin 5000 mAh' },
  { brand: 'Samsung', model: 'Galaxy A55', ram: '8GB', storage: '128GB', color: 'Xanh', price: 9990000, sale_price: 9490000, stock: 30, config: 'Màn hình 6.6 inch Super AMOLED; Chip Exynos 1480; Camera sau 50MP + 12MP + 5MP; Pin 5000 mAh' },
  { brand: 'Samsung', model: 'Galaxy Z Flip5', ram: '8GB', storage: '256GB', color: 'Tím', price: 25990000, sale_price: null, stock: 0, config: 'Màn hình gập 6.7 inch; Chip Snapdragon 8 Gen 2; Camera sau 12MP + 12MP; Pin 3700 mAh' },
  { brand: 'Apple', model: 'iPhone 15', ram: '6GB', storage: '128GB', color: 'Hồng', price: 21990000, sale_price: 19990000, stock: 15, config: 'Màn hình 6.1 inch Super Retina XDR; Chip A16 Bionic; Camera sau 48MP + 12MP; Pin khoảng 3349 mAh' },
  { brand: 'Apple', model: 'iPhone 15 Pro Max', ram: '8GB', storage: '256GB', color: 'Titan tự nhiên', price: 34990000, sale_price: null, stock: 8, config: 'Màn hình 6.7 inch Super Retina XDR 120Hz; Chip A17 Pro; Camera sau 48MP + 12MP + 12MP; Pin khoảng 4441 mAh' },
  { brand: 'Apple', model: 'iPhone 14', ram: '6GB', storage: '128GB', color: 'Trắng', price: 17990000, sale_price: 15990000, stock: 20, config: 'Màn hình 6.1 inch Super Retina XDR; Chip A15 Bionic; Camera sau 12MP + 12MP; Pin khoảng 3279 mAh' },
  { brand: 'Apple', model: 'iPhone 13', ram: '4GB', storage: '128GB', color: 'Đen', price: 14990000, sale_price: 12990000, stock: 4, config: 'Màn hình 6.1 inch Super Retina XDR; Chip A15 Bionic; Camera sau 12MP + 12MP; Pin khoảng 3240 mAh' },
  { brand: 'Xiaomi', model: 'Xiaomi 14', ram: '12GB', storage: '256GB', color: 'Trắng', price: 22990000, sale_price: 20990000, stock: 10, config: 'Màn hình 6.36 inch AMOLED 120Hz; Chip Snapdragon 8 Gen 3; Camera Leica 50MP x3; Pin 4610 mAh' },
  { brand: 'Xiaomi', model: 'Xiaomi 14T Pro', ram: '12GB', storage: '512GB', color: 'Đen', price: 16990000, sale_price: null, stock: 14, config: 'Màn hình 6.67 inch AMOLED 144Hz; Chip Dimensity 9300+; Camera Leica 50MP + 50MP + 12MP; Pin 5000 mAh' },
  { brand: 'Xiaomi', model: 'Redmi Note 13', ram: '6GB', storage: '128GB', color: 'Xanh', price: 5990000, sale_price: 5290000, stock: 40, config: 'Màn hình 6.67 inch AMOLED 120Hz; Chip Snapdragon 685; Camera sau 108MP + 8MP + 2MP; Pin 5000 mAh' },
  { brand: 'Xiaomi', model: 'Redmi 13C', ram: '4GB', storage: '128GB', color: 'Xanh', price: 3290000, sale_price: null, stock: 55, config: 'Màn hình 6.74 inch IPS 90Hz; Chip Helio G85; Camera sau 50MP + 2MP; Pin 5000 mAh' },
  { brand: 'OPPO', model: 'Reno11 F 5G', ram: '8GB', storage: '256GB', color: 'Xanh', price: 8990000, sale_price: 8490000, stock: 18, config: 'Màn hình 6.7 inch AMOLED 120Hz; Chip Dimensity 7050; Camera sau 64MP + 8MP + 2MP; Pin 5000 mAh' },
  { brand: 'OPPO', model: 'Find X7 Ultra', ram: '16GB', storage: '512GB', color: 'Nâu', price: 29990000, sale_price: null, stock: 3, config: 'Màn hình 6.82 inch LTPO AMOLED 120Hz; Chip Snapdragon 8 Gen 3; Camera Hasselblad 50MP x4; Pin 5000 mAh' },
  { brand: 'OPPO', model: 'A79 5G', ram: '8GB', storage: '128GB', color: 'Tím', price: 6990000, sale_price: 6490000, stock: 25, config: 'Màn hình 6.72 inch IPS 90Hz; Chip Dimensity 6020; Camera sau 50MP + 2MP; Pin 5000 mAh' },
  { brand: 'Vivo', model: 'V30e', ram: '8GB', storage: '256GB', color: 'Tím', price: 9490000, sale_price: null, stock: 16, config: 'Màn hình 6.78 inch AMOLED 120Hz; Chip Snapdragon 6 Gen 1; Camera sau 50MP + 8MP; Pin 5500 mAh' },
  { brand: 'Vivo', model: 'Y36', ram: '8GB', storage: '128GB', color: 'Đen', price: 5490000, sale_price: 4990000, stock: 35, config: 'Màn hình 6.64 inch IPS 90Hz; Chip Snapdragon 680; Camera sau 50MP + 2MP; Pin 5000 mAh' },
  { brand: 'Vivo', model: 'X100 Pro', ram: '16GB', storage: '512GB', color: 'Xanh', price: 27990000, sale_price: 25990000, stock: 5, config: 'Màn hình 6.78 inch AMOLED 120Hz; Chip Dimensity 9300; Camera Zeiss 50MP + 50MP + 50MP; Pin 5400 mAh' },
  { brand: 'Realme', model: 'Realme 12 Pro+', ram: '8GB', storage: '256GB', color: 'Nâu', price: 10990000, sale_price: 9990000, stock: 22, config: 'Màn hình 6.7 inch AMOLED 120Hz; Chip Snapdragon 7s Gen 2; Camera sau 50MP + 64MP + 8MP; Pin 5000 mAh' },
  { brand: 'Realme', model: 'Realme C67', ram: '8GB', storage: '256GB', color: 'Xanh', price: 5690000, sale_price: null, stock: 28, config: 'Màn hình 6.72 inch IPS 90Hz; Chip Snapdragon 685; Camera sau 108MP + 2MP; Pin 5000 mAh' },
];

async function seed(): Promise<void> {
  const dataSource = await new DataSource(dataSourceOptions).initialize();
  try {
    const categoryRepo = dataSource.getRepository(Category);
    const productRepo = dataSource.getRepository(Product);
    const userRepo = dataSource.getRepository(User);

    // Chạy lại nhiều lần vẫn an toàn: mục nào có rồi thì bỏ qua
    const categories = new Map<string, Category>();
    for (const brand of BRANDS) {
      const slug = slugify(`Điện thoại ${brand}`);
      let category = await categoryRepo.findOneBy({ slug });
      if (!category) {
        category = await categoryRepo.save(
          categoryRepo.create({ name: `Điện thoại ${brand}`, slug, description: `Các dòng điện thoại ${brand}` }),
        );
      }
      categories.set(brand, category);
    }

    let addedProducts = 0;
    for (const phone of PHONES) {
      const name = `${phone.model} ${phone.storage}`;
      const slug = slugify(`${name} ${phone.color}`);
      if (await productRepo.findOneBy({ slug })) continue;

      await productRepo.save(
        productRepo.create({
          name,
          slug,
          description: `${phone.brand} ${phone.model} chính hãng, bảo hành 12 tháng.`,
          brand: phone.brand,
          ram: phone.ram,
          storage: phone.storage,
          color: phone.color,
          config_description: phone.config,
          price: String(phone.price),
          sale_price: phone.sale_price === null ? null : String(phone.sale_price),
          stock: phone.stock,
          image_url: null,
          is_active: true,
          category: categories.get(phone.brand),
        }),
      );
      addedProducts++;
    }

    let adminCreated = false;
    if (!(await userRepo.findOneBy({ email: ADMIN_EMAIL }))) {
      await userRepo.save(
        userRepo.create({
          email: ADMIN_EMAIL,
          password_hash: await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
          role: UserRole.ADMIN,
          profile: { full_name: 'Quản trị viên' },
        }),
      );
      adminCreated = true;
    }

    console.log(`Seed xong: thêm ${addedProducts}/${PHONES.length} sản phẩm.`);
    console.log(
      adminCreated
        ? `Đã tạo tài khoản admin: ${ADMIN_EMAIL} (mật khẩu mặc định trong seed.ts, hãy đổi sau khi đăng nhập).`
        : `Tài khoản admin ${ADMIN_EMAIL} đã tồn tại, giữ nguyên.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed thất bại:', error);
  process.exit(1);
});
