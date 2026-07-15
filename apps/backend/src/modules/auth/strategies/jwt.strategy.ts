import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserDto } from '../../user/dto/user.dto';
import { UserService } from '../../user/user.service';
import { JwtPayload } from '../types';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserDto> {
    const user = await this.userService.findOneByEmail(payload.email);

    if (!user.isActive) {
      throw new UnauthorizedException('Konto jest nieaktywne');
    }

    return user;
  }
}
