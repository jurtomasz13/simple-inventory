import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaMapperBase } from '../../common/prisma-mapper.base';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService extends PrismaMapperBase<User, UserDto> {
  constructor(private readonly prisma: PrismaService) {
    super(UserDto);
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const hashedPassword = await this.hashPassword(createUserDto.password);

    const userEntity = await this.prisma.user.create({
      data: {
        email: createUserDto.email.trim().toLowerCase(),
        password: hashedPassword,
        name: createUserDto.name.trim(),
        isActive: false,
      },
    });

    return this.toDefaultDto(userEntity);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany();

    return this.toDefaultDtos(users);
  }

  async findOne(
    query: Prisma.UserFindUniqueArgs<DefaultArgs>
  ): Promise<UserDto> {
    const userEntity = await this.prisma.user.findUniqueOrThrow(query);

    return this.toDefaultDto(userEntity);
  }

  async findOneByEmail(email: string): Promise<UserDto> {
    return this.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
