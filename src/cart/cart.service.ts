import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { fromCents, unitPriceCents } from '../common/money';

@Injectable()
export class CartService {
  constructor(
    @Inject('CART_REPOSITORY')
    private readonly cartRepository: Repository<Cart>,
    @Inject('CART_ITEM_REPOSITORY')
    private readonly cartItemRepository: Repository<CartItem>,
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: Repository<Product>,
  ) {}

  // 1. Xem giỏ hàng của tôi (chưa có giỏ thì trả giỏ rỗng)
  async getCart(userId: string): Promise<CartResponseDto> {
    return this.toResponse(await this.findCart(userId));
  }

  // 2. Thêm sản phẩm vào giỏ, cộng dồn nếu đã có
  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.productRepository.findOneBy({
      product_id: dto.productId,
      is_active: true,
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID = ${dto.productId}`);
    }

    let cart = await this.findCart(userId);
    if (!cart) {
      cart = await this.cartRepository.save(
        this.cartRepository.create({ user: { user_id: userId } }),
      );
      cart.items = [];
    }

    const existing = cart.items.find((item) => item.product.product_id === product.product_id);
    const newQuantity = (existing?.quantity ?? 0) + dto.quantity;
    this.assertStock(product, newQuantity);

    if (existing) {
      existing.quantity = newQuantity;
      await this.cartItemRepository.save(existing);
    } else {
      await this.cartItemRepository.save(
        this.cartItemRepository.create({ cart, product, quantity: dto.quantity }),
      );
    }
    return this.getCart(userId);
  }

  // 3. Đổi số lượng một dòng trong giỏ
  async updateItem(userId: string, itemId: number, dto: UpdateCartItemDto): Promise<CartResponseDto> {
    const item = await this.findOwnedItem(userId, itemId);
    this.assertStock(item.product, dto.quantity);
    item.quantity = dto.quantity;
    await this.cartItemRepository.save(item);
    return this.getCart(userId);
  }

  // 4. Xóa một dòng khỏi giỏ
  async removeItem(userId: string, itemId: number): Promise<CartResponseDto> {
    const item = await this.findOwnedItem(userId, itemId);
    await this.cartItemRepository.remove(item);
    return this.getCart(userId);
  }

  private async findCart(userId: string): Promise<Cart | null> {
    const cart = await this.cartRepository.findOne({
      where: { user: { user_id: userId } },
      relations: { items: { product: true } },
      order: { cart_id: 'ASC' },
    });
    if (cart) {
      cart.items.sort((a, b) => a.cart_item_id - b.cart_item_id);
    }
    return cart;
  }

  // Dòng giỏ hàng phải thuộc giỏ của chính người dùng đang đăng nhập
  private async findOwnedItem(userId: string, itemId: number): Promise<CartItem> {
    const item = await this.cartItemRepository.findOne({
      where: { cart_item_id: itemId },
      relations: { cart: { user: true }, product: true },
    });
    if (!item) {
      throw new NotFoundException(`Không tìm thấy dòng giỏ hàng có ID = ${itemId}`);
    }
    if (item.cart.user.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền với giỏ hàng này');
    }
    return item;
  }

  private assertStock(product: Product, quantity: number): void {
    if (!product.is_active) {
      throw new BadRequestException(`Sản phẩm "${product.name}" hiện không bán`);
    }
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho`,
      );
    }
  }

  private toResponse(cart: Cart | null): CartResponseDto {
    const items = (cart?.items ?? []).map((item) => {
      const unitCents = unitPriceCents(item.product);
      return {
        cart_item_id: item.cart_item_id,
        quantity: item.quantity,
        unit_price: fromCents(unitCents),
        line_total: fromCents(unitCents * item.quantity),
        product: {
          product_id: item.product.product_id,
          name: item.product.name,
          brand: item.product.brand,
          ram: item.product.ram,
          storage: item.product.storage,
          color: item.product.color,
          slug: item.product.slug,
          image_url: item.product.image_url,
          stock: item.product.stock,
        },
      };
    });

    // Cộng bằng số nguyên (xu) rồi mới đổi lại thành tiền
    const totalCents = (cart?.items ?? []).reduce(
      (sum, item) => sum + unitPriceCents(item.product) * item.quantity,
      0,
    );
    return {
      cart_id: cart?.cart_id ?? null,
      items,
      total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: fromCents(totalCents),
    };
  }
}
