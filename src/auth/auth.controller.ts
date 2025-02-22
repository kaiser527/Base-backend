import {
  Controller,
  Post,
  UseGuards,
  Res,
  Request,
  Get,
  Req,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { Request as ExpressRequest, Response } from 'express';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';
import { IPermission } from 'src/permissions/permissions.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rolesService: RolesService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('User ogin')
  @Post('/login')
  handleLogin(@Request() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @Post('/register')
  @ResponseMessage('User Register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Get('/account')
  @ResponseMessage('Get user info')
  async getAccount(@User() user: IUser) {
    const temp = await this.rolesService.findOne(user.role.id);
    let newPermissions: IPermission[] = [];
    newPermissions = temp.permissions.map((item) => {
      return {
        id: item.id,
        name: item.name,
        apiPath: item.apiPath,
        method: item.method,
        module: item.module,
      };
    });
    user.role.permissions = newPermissions;
    return { user };
  }

  @Get('/refresh')
  @ResponseMessage('Get user by refresh token')
  handleRefreshToken(
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refresh_token = request.cookies['refresh_token'];
    return this.authService.processNewToken(refresh_token, response);
  }

  @Post('/logout')
  @ResponseMessage('User logout')
  handleLogoutUser(
    @Res({ passthrough: true }) response: Response,
    @User() user: IUser,
  ) {
    return this.authService.logout(user, response);
  }
}
