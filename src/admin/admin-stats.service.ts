import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { fromCents, toCents } from '../common/money';
import { StatsGroupBy, StatsQueryDto, StatsResponseDto } from './dto/admin-stats.dto';

const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;
const TOP_PRODUCTS_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

// Chuỗi định dạng cố định (không lấy từ người dùng) để gom nhóm trong SQL
const PERIOD_FORMATS: Record<StatsGroupBy, string> = {
  [StatsGroupBy.DAY]: '%Y-%m-%d',
  [StatsGroupBy.MONTH]: '%Y-%m',
};

@Injectable()
export class AdminStatsService {
  constructor(
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: Repository<Order>,
    @Inject('ORDER_ITEM_REPOSITORY')
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  // Doanh thu chỉ tính các đơn đã giao (delivered), lọc theo ngày đặt hàng
  async getStats(query: StatsQueryDto): Promise<StatsResponseDto> {
    const { from, to } = this.resolveRange(query);
    const groupBy = query.groupBy ?? StatsGroupBy.DAY;
    const start = `${from} 00:00:00`;
    const end = `${to} 23:59:59.999999`;

    // Các điều kiện đều đi qua tham số (:name)
    const deliveredOrders = () =>
      this.orderRepository
        .createQueryBuilder('o')
        .where('o.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('o.created_at BETWEEN :start AND :end', { start, end });
    const deliveredItems = () =>
      this.orderItemRepository
        .createQueryBuilder('oi')
        .innerJoin('oi.order', 'o')
        .where('o.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('o.created_at BETWEEN :start AND :end', { start, end });

    const [totals, series, sold, top] = await Promise.all([
      deliveredOrders()
        .select('COALESCE(SUM(o.total_amount), 0)', 'revenue')
        .addSelect('COUNT(o.order_id)', 'orders')
        .getRawOne<{ revenue: string; orders: string }>(),
      deliveredOrders()
        .select(`DATE_FORMAT(o.created_at, '${PERIOD_FORMATS[groupBy]}')`, 'period')
        .addSelect('SUM(o.total_amount)', 'revenue')
        .addSelect('COUNT(o.order_id)', 'orders')
        .groupBy('period')
        .orderBy('period', 'ASC')
        .getRawMany<{ period: string; revenue: string; orders: string }>(),
      deliveredItems()
        .select('COALESCE(SUM(oi.quantity), 0)', 'sold')
        .getRawOne<{ sold: string }>(),
      deliveredItems()
        .innerJoin('oi.product', 'p')
        .select('p.product_id', 'product_id')
        .addSelect('p.name', 'name')
        .addSelect('SUM(oi.quantity)', 'quantity_sold')
        .addSelect('SUM(oi.quantity * oi.price)', 'revenue')
        .groupBy('p.product_id')
        .addGroupBy('p.name')
        .orderBy('quantity_sold', 'DESC')
        .addOrderBy('p.product_id', 'ASC')
        .limit(TOP_PRODUCTS_LIMIT)
        .getRawMany<{ product_id: string; name: string; quantity_sold: string; revenue: string }>(),
    ]);

    // Kỳ không có đơn vẫn được trả về với giá trị 0 để vẽ biểu đồ liền mạch
    const byPeriod = new Map(series.map((row) => [row.period, row]));
    const filledSeries = this.listPeriods(from, to, groupBy).map((period) => {
      const row = byPeriod.get(period);
      return {
        period,
        revenue: fromCents(toCents(row?.revenue ?? 0)),
        orders: Number(row?.orders ?? 0),
      };
    });

    return {
      range: { from, to, groupBy },
      totals: {
        revenue: fromCents(toCents(totals?.revenue ?? 0)),
        orders: Number(totals?.orders ?? 0),
        products_sold: Number(sold?.sold ?? 0),
      },
      series: filledSeries,
      top_products: top.map((row) => ({
        product_id: Number(row.product_id),
        name: row.name,
        quantity_sold: Number(row.quantity_sold),
        revenue: fromCents(toCents(row.revenue)),
      })),
    };
  }

  // Mặc định 30 ngày gần nhất; kiểm tra ngày hợp lệ, from <= to, tối đa 366 ngày
  private resolveRange(query: StatsQueryDto): { from: string; to: string } {
    const to = query.to ?? this.formatDate(new Date());
    const from = query.from ?? this.formatDate(new Date(this.parseDate(to, 'to') - (DEFAULT_RANGE_DAYS - 1) * DAY_MS));

    const fromMs = this.parseDate(from, 'from');
    const toMs = this.parseDate(to, 'to');
    if (fromMs > toMs) {
      throw new BadRequestException('from không được sau to');
    }
    if ((toMs - fromMs) / DAY_MS + 1 > MAX_RANGE_DAYS) {
      throw new BadRequestException(`Khoảng thời gian tối đa ${MAX_RANGE_DAYS} ngày`);
    }
    return { from, to };
  }

  // "2026-02-30" khớp định dạng nhưng không phải ngày thật nên phải kiểm tra lại
  private parseDate(value: string, field: string): number {
    const [y, m, d] = value.split('-').map(Number);
    const ms = Date.UTC(y, m - 1, d);
    const date = new Date(ms);
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
      throw new BadRequestException(`${field} không phải ngày hợp lệ`);
    }
    return ms;
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private listPeriods(from: string, to: string, groupBy: StatsGroupBy): string[] {
    const periods: string[] = [];
    if (groupBy === StatsGroupBy.MONTH) {
      let [year, month] = from.split('-').map(Number);
      const [toYear, toMonth] = to.split('-').map(Number);
      while (year < toYear || (year === toYear && month <= toMonth)) {
        periods.push(`${year}-${String(month).padStart(2, '0')}`);
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
      return periods;
    }

    const endMs = this.parseDate(to, 'to');
    for (let ms = this.parseDate(from, 'from'); ms <= endMs; ms += DAY_MS) {
      periods.push(new Date(ms).toISOString().slice(0, 10));
    }
    return periods;
  }
}
