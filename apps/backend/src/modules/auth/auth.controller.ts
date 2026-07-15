import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
  Redirect,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LocalAuthGuard } from './guards/local.guard';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserDto } from '../user/dto/user.dto';
import { User } from '../../decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User() user: UserDto) {
    return user;
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@User() user: UserDto) {
    return this.authService.login(user);
  }

  @Get('login-dummy')
  @Redirect()
  async loginDummy(@Query('redirect') requestedRedirect?: string) {
    const token = await this.authService.loginDummy();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const configuredFrontend = new URL(frontendUrl);
    let redirectUrl = new URL(frontendUrl);

    if (requestedRedirect) {
      try {
        const candidate = new URL(requestedRedirect);
        const isDevelopment = process.env.NODE_ENV !== 'production';

        if (isDevelopment || candidate.origin === configuredFrontend.origin) {
          redirectUrl = candidate;
        }
      } catch {
        // Nieprawidłowy adres powrotu — użyj skonfigurowanego frontendu.
      }
    }

    redirectUrl.searchParams.set('token', token);
    return {
      url: redirectUrl.toString(),
      statusCode: HttpStatus.TEMPORARY_REDIRECT,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refreshToken')
  async refreshToken(@Request() req: Express.Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!token) {
      throw new Error('No token provided');
    }

    return this.authService.refreshToken(token);
  }
}
