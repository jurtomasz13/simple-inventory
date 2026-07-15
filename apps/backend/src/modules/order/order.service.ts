import { BadRequestException, Injectable } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { PrismaMapperBase } from '../../common/prisma-mapper.base';
import { PrismaService } from '../prisma/prisma.service';
import type { UserId } from '../user/types';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDto, OrderId } from './dto/order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import type { CreateOrderItemDto } from '../order-item/dto/create-order-item.dto';

const orderInclude = {
  inventory: {
    select: { id: true, name: true, date: true },
  },
  orderItems: {
    include: {
      product: {
        include: { category: true },
      },
    },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrderService extends PrismaMapperBase<Order, OrderDto> {
  constructor(private readonly prisma: PrismaService) {
    super(OrderDto);
  }

  private normalizeOrderItems(items: CreateOrderItemDto[]) {
    const quantities = new Map<string, number>();
    items.forEach((item) => {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity
      );
    });
    return [...quantities.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async validateOrderRelations(
    inventoryId: string,
    items: CreateOrderItemDto[],
    userId: UserId
  ) {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const [inventory, products, countedItems] = await Promise.all([
      this.prisma.inventory.findUniqueOrThrow({
        where: { id: inventoryId, userId },
        select: { id: true },
      }),
      this.prisma.product.findMany({
        where: { id: { in: productIds }, userId },
        select: { id: true },
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          inventoryId,
          inventory: { userId },
          productId: { in: productIds },
        },
        select: { productId: true },
        distinct: ['productId'],
      }),
    ]);

    const ownedProductIds = new Set(products.map((product) => product.id));
    if (ownedProductIds.size !== productIds.length) {
      throw new BadRequestException(
        'Paragon zawiera produkt, który nie należy do użytkownika.'
      );
    }

    const countedProductIds = new Set(
      countedItems.map((item) => item.productId).filter(Boolean)
    );
    const missingProducts = productIds.filter(
      (productId) => !countedProductIds.has(productId)
    );
    if (missingProducts.length > 0) {
      throw new BadRequestException(
        'Na paragonie można umieścić tylko produkty policzone w tej inwentaryzacji.'
      );
    }

    return inventory;
  }

  async create(
    createOrderDto: CreateOrderDto,
    userId: UserId
  ): Promise<OrderDto> {
    await this.validateOrderRelations(
      createOrderDto.inventoryId,
      createOrderDto.orderItems,
      userId
    );
    const orderItems = this.normalizeOrderItems(createOrderDto.orderItems);
    const orderEntity = await this.prisma.order.create({
      data: {
        name: createOrderDto.name,
        user: { connect: { id: userId } },
        inventory: {
          connect: { id: createOrderDto.inventoryId, userId },
        },
        orderItems: { createMany: { data: orderItems } },
      },
      include: orderInclude,
    });

    return this.toDefaultDto(orderEntity);
  }

  async findAll(userId: UserId, inventoryId?: string): Promise<OrderDto[]> {
    const items = await this.prisma.order.findMany({
      where: {
        userId,
        ...(inventoryId && { inventoryId }),
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });

    return this.toDefaultDtos(items);
  }

  async findOneById(id: OrderId, userId: UserId): Promise<OrderDto> {
    const orderEntity = await this.prisma.order.findUniqueOrThrow({
      where: { id, userId },
      include: orderInclude,
    });
    return this.toDefaultDto(orderEntity);
  }

  async update(
    id: OrderId,
    updateData: UpdateOrderDto,
    userId: UserId
  ): Promise<OrderDto> {
    const currentOrder = await this.prisma.order.findUniqueOrThrow({
      where: { id, userId },
      include: { orderItems: true },
    });
    const inventoryId = updateData.inventoryId ?? currentOrder.inventoryId;

    if (!inventoryId) {
      throw new BadRequestException('Paragon musi należeć do inwentaryzacji.');
    }

    const effectiveItems = updateData.orderItems ?? currentOrder.orderItems
      .filter((item): item is typeof item & { productId: string } => Boolean(item.productId))
      .map((item) => ({ productId: item.productId, quantity: item.quantity }));

    await this.validateOrderRelations(inventoryId, effectiveItems, userId);
    const normalizedItems = this.normalizeOrderItems(effectiveItems);
    const orderEntity = await this.prisma.order.update({
      where: { id, userId },
      data: {
        name: updateData.name,
        ...(updateData.inventoryId && {
          inventory: { connect: { id: inventoryId, userId } },
        }),
        ...(updateData.orderItems && {
          orderItems: {
            deleteMany: {},
            createMany: { data: normalizedItems },
          },
        }),
      },
      include: orderInclude,
    });

    return this.toDefaultDto(orderEntity);
  }

  async delete(id: OrderId, userId: UserId) {
    await this.prisma.order.delete({ where: { id, userId } });
  }
}
