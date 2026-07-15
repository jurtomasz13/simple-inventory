import { Transform, Type } from 'class-transformer';
import { InventoryDto, InventoryId } from '../../inventory/dto/inventory.dto';
import { TransformDate } from '../../../common/class-transformer.types';
import { UserId } from '../../user/types';
import { UserDto } from '../../user/dto/user.dto';
import { OrderItemDto } from '../../order-item/dto/order-item.dto';

export class OrderDto {
  id: string;
  name: string;
  inventoryId: InventoryId | null;
  userId: UserId;

  @Transform(({ value }: TransformDate) => value.toISOString(), {
    toPlainOnly: true,
  })
  createdAt: Date;
  @Transform(({ value }: TransformDate) => value.toISOString(), {
    toPlainOnly: true,
  })
  updatedAt: Date;

  @Type(() => UserDto)
  user?: UserDto;
  @Type(() => InventoryDto)
  inventory?: InventoryDto;
  @Type(() => OrderItemDto)
  orderItems?: OrderItemDto[];
}

export type OrderId = OrderDto['id'];
