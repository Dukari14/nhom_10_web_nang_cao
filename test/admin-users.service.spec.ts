import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from '../src/admin/admin-users.service';
import { UserRole } from '../src/user/user.entity';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let userRepository: { findOne: jest.Mock; save: jest.Mock; createQueryBuilder: jest.Mock };
  let qb: Record<string, jest.Mock>;

  const makeUser = () => ({
    user_id: '11111111-1111-4111-8111-111111111111',
    email: 'a@test.com',
    password_hash: '$2b$10$khong-duoc-lo',
    role: UserRole.CUSTOMER,
    is_active: true,
    created_at: new Date(),
    profile: { full_name: 'Nguyen Van A', phone: '0987654321' },
  });

  beforeEach(() => {
    qb = {};
    for (const name of ['leftJoinAndSelect', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take']) {
      qb[name] = jest.fn().mockReturnValue(qb);
    }
    qb.getManyAndCount = jest.fn().mockResolvedValue([[makeUser()], 1]);
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (user) => user),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    service = new AdminUsersService(userRepository as any);
  });

  it('danh sách không bao giờ chứa password_hash', async () => {
    const result = await service.findAll({});

    expect(JSON.stringify(result)).not.toContain('password_hash');
    expect(JSON.stringify(result)).not.toContain('khong-duoc-lo');
    expect(result.items[0]).toMatchObject({ email: 'a@test.com', full_name: 'Nguyen Van A', is_active: true });
  });

  it('tìm kiếm bằng tham số LIKE đã thoát ký tự đặc biệt', async () => {
    await service.findAll({ search: '50%_' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(u.email LIKE :keyword OR p.full_name LIKE :keyword)',
      { keyword: '%50\\%\\_%' },
    );
  });

  it('khóa tài khoản khách hàng', async () => {
    userRepository.findOne.mockResolvedValue(makeUser());

    const result = await service.update('admin-id', '11111111-1111-4111-8111-111111111111', { is_active: false });

    expect(result.is_active).toBe(false);
    expect(userRepository.save).toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain('khong-duoc-lo');
  });

  it('đổi role thành admin', async () => {
    userRepository.findOne.mockResolvedValue(makeUser());

    const result = await service.update('admin-id', '11111111-1111-4111-8111-111111111111', { role: UserRole.ADMIN });

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('báo lỗi 400 khi không gửi trường nào để đổi', async () => {
    await expect(service.update('admin-id', 'x', {})).rejects.toThrow(BadRequestException);
  });

  it('báo lỗi 400 khi admin tự khóa hoặc tự hạ quyền chính mình', async () => {
    await expect(service.update('me', 'me', { is_active: false })).rejects.toThrow(BadRequestException);
    await expect(service.update('me', 'me', { role: UserRole.CUSTOMER })).rejects.toThrow(BadRequestException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('báo lỗi 404 khi tài khoản không tồn tại', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.update('admin-id', 'khac', { is_active: false })).rejects.toThrow(NotFoundException);
  });
});
