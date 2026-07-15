import { Type } from 'class-transformer';
import { OrderDto, OrderId } from '../../order/dto/order.dto';
import { ProductId } from '../../product/types';
import { ProductDto } from '../../product/dto/product.dto';

export class OrderItemDto {
  id: string;
  quantity: number;
  productId: ProductId | null;
  orderId: OrderId;

  @Type(() => ProductDto)
  product?: ProductDto;
  @Type(() => OrderDto)
  order?: OrderDto;
}

export type OrderItemId = OrderItemDto['id'];
