import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOnebyUsername(username);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid) {
        return user;
      }
    }
    return null;
  }

  login = async (user: IUser, response: Response) => {
    const payload = {
      sub: 'token login',
      iss: 'from server',
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };
    const refresh_token = this.createRefreshToken(payload);
    await this.usersService.updateUserToken(refresh_token, user.id);
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: +this.configService.get<string>('COOKIE_AGE'),
    });
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
      },
    };
  };

  async register(registerUserDto: RegisterUserDto) {
    return await this.usersService.register(registerUserDto);
  }

  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
      let user = await this.usersService.findUserByToken(refreshToken);
      if (user) {
        const newRole = {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.permissions.map((item) => {
            return {
              id: item.id,
              name: item.name,
              apiPath: item.apiPath,
              method: item.method,
              module: item.module,
            };
          }),
        };
        const payload = {
          sub: 'token refresh',
          iss: 'from server',
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            id: user.role.id,
            name: user.role.name,
          },
        };
        const refresh_token = this.createRefreshToken(payload);
        await this.usersService.updateUserToken(refresh_token, user.id);
        response.clearCookie('refresh_token');
        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: +this.configService.get<string>('COOKIE_AGE'),
        });
        return {
          access_token: this.jwtService.sign(payload),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: newRole,
          },
        };
      } else {
        throw new BadRequestException('Refresh token is invalid, please login');
      }
    } catch (e) {
      throw new BadRequestException('Refresh token is invalid, please login');
    }
  };

  logout = async (user: IUser, response: Response) => {
    response.clearCookie('refresh_token');
    await this.usersService.updateUserToken('', user.id);
    return 'OK';
  };

  createRefreshToken = (payload: Object) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRE_REFRESH'),
    });
    return refresh_token;
  };
}
