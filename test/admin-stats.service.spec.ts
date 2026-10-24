import { BadRequestException } from '@nestjs/common';
import { AdminStatsService } from '../src/admin/admin-stats.service';
import { StatsGroupBy } from '../src/admin/dto/admin-stats.dto';

// Giả lập QueryBuilder: mỗi hàm trả lại chính nó, hàm kết thúc trả dữ liệu cho sẵn
function createQb(raw: { one?: unknown; many?: unknown[] }) {
  const qb: Record<string, jest.Mock> = {};
  for (const name of ['select', 'addSelect', 'where', 'andWhere', 'innerJoin', 'groupBy', 'addGroupBy', 'orderBy', 'addOrderBy', 'limit']) {
    qb[name] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawOne = jest.fn().mockResolvedValue(raw.one);
  qb.getRawMany = jest.fn().mockResolvedValue(raw.many ?? []);
  return qb;
}

describe('AdminStatsService', () => {
  let service: AdminStatsService;
  let orderQb: Record<string, jest.Mock>;
  let itemQb: Record<string, jest.Mock>;

  function setup(data: {
    totals?: unknown;
    series?: unknown[];
    sold?: unknown;
    top?: unknown[];
  }) {
    // Đơn hàng: lần gọi getRawOne là tổng, getRawMany là chuỗi theo ngày/tháng
    orderQb = createQb({ one: data.totals, many: data.series });
    // Dòng đơn hàng: getRawOne là số máy bán ra, getRawMany là top sản phẩm
    itemQb = createQb({ one: data.sold, many: data.top });
    service = new AdminStatsService(
      { createQueryBuilder: jest.fn().mockReturnValue(orderQb) } as any,
      { createQueryBuilder: jest.fn().mockReturnValue(itemQb) } as any,
    );
  }

  it('trả tổng doanh thu, số máy bán ra và top sản phẩm dạng số', async () => {
    setup({
      totals: { revenue: '49470000.00', orders: '3' },
      series: [{ period: '2026-10-02', revenue: '39980000.00', orders: '2' }, { period: '2026-10-04', revenue: '9490000.00', orders: '1' }],
      sold: { sold: '7' },
      top: [
        { product_id: '1', name: 'Galaxy S24 256GB', quantity_sold: '4', revenue: '79960000.00' },
        { product_id: '3', name: 'Galaxy A55 128GB', quantity_sold: '3', revenue: '28470000.00' },
      ],
    });

    const stats = await service.getStats({ from: '2026-10-01', to: '2026-10-05' });

    expect(stats.totals).toEqual({ revenue: 49470000, orders: 3, products_sold: 7 });
    expect(typeof stats.totals.revenue).toBe('number');
    expect(stats.top_products).toEqual([
      { product_id: 1, name: 'Galaxy S24 256GB', quantity_sold: 4, revenue: 79960000 },
      { product_id: 3, name: 'Galaxy A55 128GB', quantity_sold: 3, revenue: 28470000 },
    ]);
  });

  it('doanh thu theo ngày: ngày không có đơn vẫn xuất hiện với giá trị 0', async () => {
    setup({
      totals: { revenue: '49470000.00', orders: '3' },
      series: [{ period: '2026-10-02', revenue: '39980000.00', orders: '2' }, { period: '2026-10-04', revenue: '9490000.00', orders: '1' }],
      sold: { sold: '7' },
    });

    const stats = await service.getStats({ from: '2026-10-01', to: '2026-10-05', groupBy: StatsGroupBy.DAY });

    expect(stats.series).toEqual([
      { period: '2026-10-01', revenue: 0, orders: 0 },
      { period: '2026-10-02', revenue: 39980000, orders: 2 },
      { period: '2026-10-03', revenue: 0, orders: 0 },
      { period: '2026-10-04', revenue: 9490000, orders: 1 },
      { period: '2026-10-05', revenue: 0, orders: 0 },
    ]);
    expect(stats.range).toEqual({ from: '2026-10-01', to: '2026-10-05', groupBy: 'day' });
  });

  it('doanh thu theo tháng, qua năm mới vẫn đủ các tháng', async () => {
    setup({
      totals: { revenue: '100.00', orders: '1' },
      series: [{ period: '2026-12', revenue: '100.00', orders: '1' }],
      sold: { sold: '1' },
    });

    const stats = await service.getStats({ from: '2026-11-15', to: '2027-02-10', groupBy: StatsGroupBy.MONTH });

    expect(stats.series.map((p) => p.period)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(stats.series[1]).toEqual({ period: '2026-12', revenue: 100, orders: 1 });
  });

  it('chỉ tính đơn đã giao và truyền khoảng ngày bằng tham số', async () => {
    setup({ totals: { revenue: '0', orders: '0' }, sold: { sold: '0' } });

    await service.getStats({ from: '2026-10-01', to: '2026-10-31' });

    expect(orderQb.where).toHaveBeenCalledWith('o.status = :status', { status: 'delivered' });
    expect(orderQb.andWhere).toHaveBeenCalledWith('o.created_at BETWEEN :start AND :end', {
      start: '2026-10-01 00:00:00',
      end: '2026-10-31 23:59:59.999999',
    });
    expect(itemQb.limit).toHaveBeenCalledWith(5);
  });

  it('không có đơn nào thì mọi số liệu bằng 0', async () => {
    setup({ totals: undefined, sold: undefined });

    const stats = await service.getStats({ from: '2026-10-01', to: '2026-10-02' });

    expect(stats.totals).toEqual({ revenue: 0, orders: 0, products_sold: 0 });
    expect(stats.top_products).toEqual([]);
  });

  it('mặc định 30 ngày gần nhất khi không truyền from và to', async () => {
    setup({ totals: { revenue: '0', orders: '0' }, sold: { sold: '0' } });

    const stats = await service.getStats({});

    expect(stats.series).toHaveLength(30);
  });

  describe('kiểm tra khoảng thời gian', () => {
    beforeEach(() => setup({}));

    it('báo lỗi 400 khi from sau to', async () => {
      await expect(service.getStats({ from: '2026-10-10', to: '2026-10-01' })).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi 400 khi ngày không có thật (30/02)', async () => {
      await expect(service.getStats({ from: '2026-02-30', to: '2026-03-05' })).rejects.toThrow('from không phải ngày hợp lệ');
    });

    it('báo lỗi 400 khi khoảng quá 366 ngày', async () => {
      await expect(service.getStats({ from: '2024-01-01', to: '2026-01-01' })).rejects.toThrow(BadRequestException);
    });
  });
});
