import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import type { InventoryId } from '../../inventory/dto/inventory.dto';
import type { ProductId } from '../../product/types';
import type { RoomId } from '../../room/types';

export class UpdateInventoryItemDto {
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
  roomId?: RoomId;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  inventoryId?: InventoryId;
}
