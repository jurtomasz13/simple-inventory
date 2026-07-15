import { Exclude, Transform, Type } from 'class-transformer';
import { TransformDate } from '../../../common/class-transformer.types';
import { ProductDto } from '../../product/dto/product.dto';
import { CategoryDto } from '../../category/dto/category.dto';
import { RoomDto } from '../../room/dto/room.dto';
import { InventoryDto } from '../../inventory/dto/inventory.dto';
import { OrderDto } from '../../order/dto/order.dto';

export class UserDto {
  id: string;
  email: string;
  name: string;
  isActive: boolean;

  @Exclude({ toPlainOnly: true })
  password: string;

  @Transform(({ value }: TransformDate) => value.toISOString(), {
    toPlainOnly: true,
  })
  createdAt: Date;
  @Type(() => Date)
  @Transform(({ value }: TransformDate) => value.toISOString(), {
    toPlainOnly: true,
  })
  updatedAt: Date;

  @Type(() => ProductDto)
  products?: ProductDto[];
  @Type(() => CategoryDto)
  categories?: CategoryDto[];
  @Type(() => RoomDto)
  rooms?: RoomDto[];
  @Type(() => OrderDto)
  orders?: OrderDto[];
  @Type(() => InventoryDto)
  inventories?: InventoryDto[];
}
