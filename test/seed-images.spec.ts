import { existsSync } from 'fs';
import { join } from 'path';
import { IMAGE_BASE_PATH, SEED_IMAGES, seedImageUrl } from '../src/database/seed-images';

const IMAGE_DIR = join(__dirname, '..', 'react_client', 'public', 'images', 'products');

describe('ảnh sản phẩm mẫu', () => {
  it('có ảnh cho cả 20 điện thoại trong seed', () => {
    expect(Object.keys(SEED_IMAGES)).toHaveLength(20);
  });

  it('mọi tệp được khai báo đều có thật trong react_client/public/images/products', () => {
    const missing = Object.values(SEED_IMAGES).filter((file) => !existsSync(join(IMAGE_DIR, file)));
    expect(missing).toEqual([]);
  });

  it('đường dẫn lưu vào database là đường dẫn tương đối, không kèm địa chỉ máy chủ', () => {
    expect(seedImageUrl('Galaxy S24 256GB')).toBe(`${IMAGE_BASE_PATH}/256GBgalaxy-s24-den-.webp`);
    expect(seedImageUrl('Galaxy S24 256GB')).toMatch(/^\/images\/products\//);
  });

  it('sản phẩm chưa có ảnh thì trả null', () => {
    expect(seedImageUrl('Máy chưa có ảnh')).toBeNull();
  });
});
