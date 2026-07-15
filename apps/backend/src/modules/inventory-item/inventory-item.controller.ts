import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InventoryItemService } from './inventory-item.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import type { InventoryItemId } from './dto/inventory-item.dto';
import { User } from '../../decorators/user.decorator';
import { UserDto } from '../user/dto/user.dto';
import { CreateStandaloneInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import type { InventoryId } from '../inventory/dto/inventory.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventory-item')
export class InventoryItemController {
  constructor(private readonly inventoryItemService: InventoryItemService) {}

  @Get(':id')
  getAll(@Param('id') id: InventoryId, @User() user: UserDto) {
    return this.inventoryItemService.findAll(id, user.id);
  }

  @Get('/position/:id')
  get(@Param('id') id: InventoryItemId, @User() user: UserDto) {
    return this.inventoryItemService.findOneById(id, user.id);
  }

  @Post()
  create(
    @Body() createInventoryItemDto: CreateStandaloneInventoryItemDto,
    @User() user: UserDto
  ) {
    return this.inventoryItemService.create(createInventoryItemDto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: InventoryItemId,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
    @User() user: UserDto
  ) {
    return this.inventoryItemService.update(
      id,
      updateInventoryItemDto,
      user.id
    );
  }

  @Delete(':id')
  delete(@Param('id') id: InventoryItemId, @User() user: UserDto) {
    return this.inventoryItemService.delete(id, user.id);
  }
}
