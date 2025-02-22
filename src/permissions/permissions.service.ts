import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { IUser } from 'src/users/users.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    const isExist = await this.permissionsRepository.find({
      where: [
        {
          apiPath: createPermissionDto.apiPath,
          method: createPermissionDto.method,
        },
        {
          id: createPermissionDto.id,
        },
      ],
    });
    if (isExist && isExist.length > 0)
      throw new BadRequestException('Permission is already exist');
    else {
      const create = this.permissionsRepository.create({
        ...createPermissionDto,
        createdBy: user.email,
      });
      const result = await this.permissionsRepository.save(create);
      const newResult = {
        id: result.id,
        createdAt: result.createdAt,
      };
      return newResult;
    }
  }

  async findAll(limit: number, page: number) {
    const offset = (page - 1) * limit;
    const [result, total] = await this.permissionsRepository.findAndCount({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
    });
    const data = {
      totalRows: total,
      totalPages: Math.ceil(total / limit),
      permissions: result,
    };
    return data;
  }

  async findOne(id: string) {
    const result = await this.permissionsRepository.findOneBy({ id });
    if (!result) throw new BadRequestException('User is not exist');
    else return result;
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    user: IUser,
  ) {
    const isExist = await this.permissionsRepository.findOneBy({ id });
    if (isExist) {
      return await this.permissionsRepository.save({
        ...isExist,
        ...updatePermissionDto,
        updatedBy: user.email,
      });
    } else throw new BadRequestException('Permission is not exist');
  }

  async remove(id: string, user: IUser) {
    const isExist = await this.permissionsRepository.findOneBy({ id });
    if (!isExist) throw new BadRequestException('Permission is not exist');
    else {
      await this.permissionsRepository.save({
        ...isExist,
        deletedBy: user.email,
        isDeleted: true,
      });
      return await this.permissionsRepository.softDelete({ id });
    }
  }
}
