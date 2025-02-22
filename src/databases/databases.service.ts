import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { ADMIN_ROLE, INIT_PERMISSIONS, USER_ROLE } from './sample';

@Injectable()
export class DatabasesService implements OnModuleInit {
  private readonly logger = new Logger(DatabasesService.name);
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,

    private configService: ConfigService,
    private userService: UsersService,
  ) {}
  async onModuleInit() {
    const isInit = this.configService.get<string>('SHOULD_INIT');
    if (Boolean(isInit)) {
      const countUser = await this.usersRepository.count({});
      const countPermission = await this.permissionsRepository.count({});
      const countRole = await this.rolesRepository.count({});

      //create permissions
      if (countPermission === 0) {
        await this.permissionsRepository.save(INIT_PERMISSIONS);
      }

      // create role
      if (countRole === 0) {
        await this.rolesRepository.save([
          {
            id: 'R1',
            name: ADMIN_ROLE,
            description: 'Admin thì full quyền :v',
            isActive: true,
          },
          {
            id: 'R2',
            name: USER_ROLE,
            description: 'Người dùng/Ứng viên sử dụng hệ thống',
            isActive: true,
          },
        ]);
      }

      if (countUser === 0) {
        const adminRole = await this.rolesRepository.findOneBy({
          name: ADMIN_ROLE,
        });
        const userRole = await this.rolesRepository.findOneBy({
          name: USER_ROLE,
        });
        await this.usersRepository.save([
          {
            firstName: "I'm",
            lastName: 'admin',
            email: 'admin@gmail.com',
            password: this.userService.getHashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 69,
            gender: 'MALE',
            roleId: adminRole?.id,
          },
          {
            firstName: "I'm",
            lastName: 'Hỏi Dân IT',
            email: 'hoidanit@gmail.com',
            password: this.userService.getHashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 96,
            gender: 'MALE',
            roleId: adminRole?.id,
          },
          {
            firstName: "I'm",
            lastName: 'normal user',
            email: 'user@gmail.com',
            password: this.userService.getHashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 69,
            gender: 'MALE',
            roleId: userRole?.id,
          },
        ]);
      }

      if (countUser > 0 && countRole > 0 && countPermission > 0) {
        this.logger.log('>>> ALREADY INIT SAMPLE DATA...');
      }
    }
  }
}
