import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import type { OrderId } from '../../order/dto/order.dto';
import type { ProductId } from '../../product/types';

export class UpdateOrderItemDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId?: ProductId;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  orderId?: OrderId;
}
