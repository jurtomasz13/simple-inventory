import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { PrismaMapperBase } from '../../common/prisma-mapper.base';
import { PrismaService } from '../prisma/prisma.service';
import { OrderItemDto, OrderItemId } from './dto/order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { DefaultArgs } from '@prisma/client/runtime/binary';
import { CreateStandaloneOrderItemDto } from './dto/create-order-item.dto';
import type { UserId } from '../user/types';

@Injectable()
export class OrderItemService extends PrismaMapperBase<
  OrderItem,
  OrderItemDto
> {
  constructor(private readonly prisma: PrismaService) {
    super(OrderItemDto);
  }

  private async ensureProductWasCounted(
    orderId: string,
    productId: string,
    userId: UserId
  ) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId, userId },
      select: { inventoryId: true },
    });
    if (!order.inventoryId) {
      throw new BadRequestException('Paragon nie jest przypięty do inwentaryzacji.');
    }
    const countedItem = await this.prisma.inventoryItem.findFirst({
      where: {
        inventoryId: order.inventoryId,
        productId,
        inventory: { userId },
        product: { userId },
      },
      select: { id: true },
    });
    if (!countedItem) {
      throw new BadRequestException(
        'Na paragonie można umieścić tylko produkt policzony w tej inwentaryzacji.'
      );
    }
  }

  async create(
    createOrderItemDto: CreateStandaloneOrderItemDto,
    userId: UserId
  ): Promise<OrderItemDto> {
    await this.ensureProductWasCounted(
      createOrderItemDto.orderId,
      createOrderItemDto.productId,
      userId
    );
    const orderItemEntity = await this.prisma.orderItem.create({
      data: {
        quantity: createOrderItemDto.quantity,
        order: {
          connect: {
            id: createOrderItemDto.orderId,
            userId: userId,
          },
        },
        product: {
          connect: {
            id: createOrderItemDto.productId,
            userId: userId,
          },
        },
      },
      include: {
        product: { include: { category: true } },
        order: { include: { inventory: true } },
      },
    });

    return this.toDefaultDto(orderItemEntity);
  }

  async findAll(userId: UserId): Promise<OrderItemDto[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          userId: userId,
        },
      },
      include: {
        product: { include: { category: true } },
        order: { include: { inventory: true } },
      },
    });

    return this.toDefaultDtos(items);
  }

  async findOne(
    query: Prisma.OrderItemFindUniqueArgs<DefaultArgs>
  ): Promise<OrderItemDto> {
    const orderItemEntity = await this.prisma.orderItem.findUniqueOrThrow(
      query
    );

    return this.toDefaultDto(orderItemEntity);
  }

  async findOneById(id: OrderItemId, userId: UserId) {
    return this.findOne({
      where: {
        id: id,
        order: {
          userId: userId,
        },
      },
      include: {
        product: { include: { category: true } },
        order: { include: { inventory: true } },
      },
    });
  }

  async update(
    id: OrderItemId,
    updateData: UpdateOrderItemDto,
    userId: UserId
  ): Promise<OrderItemDto> {
    const currentItem = await this.prisma.orderItem.findUniqueOrThrow({
      where: { id, order: { userId } },
      select: { productId: true, orderId: true },
    });
    const productId = updateData.productId ?? currentItem.productId;
    const orderId = updateData.orderId ?? currentItem.orderId;
    if (!productId) {
      throw new BadRequestException('Produkt na paragonie nie istnieje.');
    }
    await this.ensureProductWasCounted(orderId, productId, userId);
    const orderItemEntity = await this.prisma.orderItem.update({
      where: {
        id: id,
        order: {
          userId: userId,
        },
      },
      data: {
        quantity: updateData.quantity,
        ...(updateData.productId && {
          product: { connect: { id: updateData.productId, userId } },
        }),
        ...(updateData.orderId && {
          order: { connect: { id: updateData.orderId, userId } },
        }),
      },
      include: {
        product: { include: { category: true } },
        order: { include: { inventory: true } },
      },
    });

    return this.toDefaultDto(orderItemEntity);
  }

  async delete(id: OrderItemId, userId: UserId) {
    await this.prisma.orderItem.delete({
      where: {
        id: id,
        order: {
          userId: userId,
        },
      },
    });

    return;
  }
}
