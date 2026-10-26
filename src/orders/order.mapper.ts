import { Order } from './order.entity';
import { OrderResponseDto } from './dto/order-response.dto';
import { fromCents, toCents } from '../common/money';

// Đổi dữ liệu DB (tiền dạng chuỗi) sang response (tiền dạng số), không lộ thông tin user
export function toOrderResponse(order: Order): OrderResponseDto {
  const items = [...(order.items ?? [])]
    .sort((a, b) => a.order_item_id - b.order_item_id)
    .map((item) => ({
      order_item_id: item.order_item_id,
      product_id: item.product.product_id,
      product_name: item.product.name,
      product_brand: item.product.brand,
      quantity: item.quantity,
      price: fromCents(toCents(item.price)),
      subtotal: fromCents(toCents(item.price) * item.quantity),
    }));
  const payment = order.payments?.[0];

  return {
    order_id: order.order_id,
    status: order.status,
    total_amount: fromCents(toCents(order.total_amount)),
    shipping_address: order.shipping_address,
    phone: order.phone,
    items,
    payment: payment
      ? {
          payment_id: payment.payment_id,
          payment_method: payment.payment_method,
          status: payment.status,
          amount: fromCents(toCents(payment.amount)),
        }
      : null,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}
