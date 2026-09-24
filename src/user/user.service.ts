import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  // 1. Lấy danh sách toàn bộ User
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  // 2. Tìm 1 User theo ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ user_id: id });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy User có ID = ${id}`);
    }
    return user;
  }

  // 3. Tạo User mới
  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);
    return await this.userRepository.save(newUser);
  }

  // 4. Cập nhật thông tin User
  async update(id: number, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  // 5. Xóa User
  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy User có ID = ${id} để xóa`);
    }
  }
}