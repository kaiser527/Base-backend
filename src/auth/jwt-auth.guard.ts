import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSIONS } from 'src/decorator/customize';
import { IPermission } from 'src/permissions/permissions.interface';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly rolesService: RolesService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]); //get metadata khi gui kem request
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  async handleRequest(
    err: string,
    user: any,
    info: Error,
    context: ExecutionContext,
  ) {
    const request: Request = context.switchToHttp().getRequest();

    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );

    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Invalid Token or Bearer Token at header request is null',
        )
      );
    }

    //check permissions
    const targetMethod = request.method;
    const targetEndpoint = request.route?.path;

    const temp = await this.rolesService.findOne(user.role.id);
    user.role.permissions = temp.permissions;

    const permissions: IPermission[] = user?.role?.permissions ?? [];
    const isExist = permissions.find(
      (permission) =>
        targetMethod === permission.method &&
        targetEndpoint === permission.apiPath,
    );

    if (!isExist && !isSkipPermission)
      throw new ForbiddenException(
        "You don't have permission to access this endpoint",
      );

    return user;
  }
}
