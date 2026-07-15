import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import type { ProductId } from '../../product/types';
import type { OrderId } from '../../order/dto/order.dto';

export class CreateOrderItemDto {
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  productId: ProductId;
}

export class CreateStandaloneOrderItemDto extends CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  orderId: OrderId;
}
