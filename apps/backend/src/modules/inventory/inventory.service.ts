import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaMapperBase } from '../../common/prisma-mapper.base';
import { Inventory, Prisma } from '@prisma/client';
import { InventoryDto, InventoryId } from './dto/inventory.dto';
import { DefaultArgs } from '@prisma/client/runtime/client';
import { UserId } from '../user/types';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService extends PrismaMapperBase<
  Inventory,
  InventoryDto
> {
  constructor(private readonly prisma: PrismaService) {
    super(InventoryDto);
  }

  async create(
    createCategoryDto: CreateInventoryDto,
    userId: UserId
  ): Promise<InventoryDto> {
    const inventoryEntity = await this.prisma.inventory.create({
      data: {
        name: createCategoryDto.name,
        date: createCategoryDto.date,
        user: {
          connect: { id: userId },
        },
      },
    });

    return this.toDefaultDto(inventoryEntity);
  }

  async findAll(userId: UserId): Promise<InventoryDto[]> {
    const items = await this.prisma.inventory.findMany({
      where: {
        userId: userId,
      },
      include: {
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return items.map(({ _count, ...item }) => ({
      ...this.toDefaultDto(item),
      itemCount: _count.inventoryItems,
    }));
  }

  async findOne(
    query: Prisma.InventoryFindUniqueArgs<DefaultArgs>
  ): Promise<InventoryDto> {
    const inventoryEntity = await this.prisma.inventory.findUniqueOrThrow(
      query
    );

    return this.toDefaultDto(inventoryEntity);
  }

  async findOneById(id: InventoryId, userId: UserId) {
    return this.findOne({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        inventoryItems: true,
      },
    });
  }

  async update(
    id: InventoryId,
    updateData: UpdateInventoryDto,
    userId: UserId
  ): Promise<InventoryDto> {
    const inventoryEntity = await this.prisma.inventory.update({
      where: {
        id: id,
        userId: userId,
      },
      data: updateData,
    });

    return this.toDefaultDto(inventoryEntity);
  }

  async delete(id: InventoryId, userId: UserId) {
    await this.prisma.inventory.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return;
  }
}
