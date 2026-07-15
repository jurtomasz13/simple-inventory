import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { OrderService } from './order.service';
import { User } from '../../decorators/user.decorator';
import { UserDto } from '../user/dto/user.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import type { OrderId } from './dto/order.dto';

@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getAll(
    @User() user: UserDto,
    @Query('inventoryId') inventoryId?: string
  ) {
    return this.orderService.findAll(user.id, inventoryId);
  }

  @Get(':id')
  get(@Param('id') id: OrderId, @User() user: UserDto) {
    return this.orderService.findOneById(id, user.id);
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @User() user: UserDto) {
    return this.orderService.create(createOrderDto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: OrderId,
    @Body() updateOrderDto: UpdateOrderDto,
    @User() user: UserDto
  ) {
    return this.orderService.update(id, updateOrderDto, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: OrderId, @User() user: UserDto) {
    return this.orderService.delete(id, user.id);
  }
}
