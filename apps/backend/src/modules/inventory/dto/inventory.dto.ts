import { Transform, Type } from 'class-transformer';
import { TransformDate } from '../../../common/class-transformer.types';
import { UserDto } from '../../user/dto/user.dto';
import { InventoryItemDto } from '../../inventory-item/dto/inventory-item.dto';

export class InventoryDto {
  id: string;
  name: string;
  userId: string;
  itemCount?: number;

  @Transform(({ value }: TransformDate) => value.toISOString(), {
    toPlainOnly: true,
  })
  date: Date;
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
  @Type(() => InventoryItemDto)
  inventoryItems?: InventoryItemDto[];
}

export type InventoryId = InventoryDto['id'];
