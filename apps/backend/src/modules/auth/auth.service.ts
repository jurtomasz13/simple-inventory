import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtPayload } from './types';
import { UserDto } from '../user/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async register(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  async login(user: UserDto, rememberMe = false) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = rememberMe
      ? this.jwtService.sign(payload)
      : this.jwtService.sign(payload, { expiresIn: '12h' });

    return {
      access_token: accessToken,
      user,
    };
  }

  async refreshToken(token: string) {
    const { sub, email, name } = this.jwtService.decode(token) as JwtPayload;

    return this.jwtService.sign({ sub, email, name }, { expiresIn: '12h' });
  }

  async validateUserByPassword(email: string, password: string) {
    let user: UserDto;

    try {
      user = await this.userService.findOneByEmail(email);
    } catch {
      throw new UnauthorizedException('Nieprawidłowy e-mail lub hasło');
    }

    const passwordMatch = await this.userService.comparePassword(
      password,
      user.password
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Nieprawidłowy e-mail lub hasło');
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Konto oczekuje na aktywację przez administratora',
      });
    }

    return user;
  }
}
