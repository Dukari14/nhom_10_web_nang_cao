import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Products} from './products.entity';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly productsRepository: Repository<Products>,
  ) {}

  // 1. Lấy danh sách toàn bộ Products
  async findAll(): Promise<Products[]> {
    return await this.productsRepository.find();
  }

  // 2. Tìm 1 Product theo ID
  async findOne(id: number): Promise<Products> {
    const product = await this.productsRepository.findOneBy({ prod_id: id });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy Product có ID = ${id}`);
    }
    return product;
  }

  // 3. Tạo Product mới
  async create(productData: Partial<Products>): Promise<Products> {
    const newProduct = this.productsRepository.create(productData);
    return await this.productsRepository.save(newProduct);
  }

  // 4. Cập nhật thông tin Product
  async update(id: number, updateData: Partial<Products>): Promise<Products> {
    await this.productsRepository.update(id, updateData);
    return this.findOne(id);
  }

  // 5. Xóa Product
  async remove(id: number): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy Product có ID = ${id} để xóa`);
    }
  }
}