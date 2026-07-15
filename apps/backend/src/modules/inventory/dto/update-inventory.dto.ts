import { Type } from 'class-transformer';
import { IsDate, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
