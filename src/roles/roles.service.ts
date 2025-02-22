import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { IUser } from 'src/users/users.interface';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const isExist = await this.rolesRepository.find({
      where: [{ name: createRoleDto.name }, { id: createRoleDto.id }],
    });
    if (isExist && isExist.length > 0)
      throw new BadRequestException('Role is already exist');
    else {
      const create = this.rolesRepository.create({
        ...createRoleDto,
        createdBy: user.email,
      });
      const result = await this.rolesRepository.save(create);
      const newResult = {
        id: result.id,
        createdAt: result.createdAt,
      };
      return newResult;
    }
  }

  async findAll(limit: number, page: number) {
    const offset = (page - 1) * limit;
    const [result, total] = await this.rolesRepository.findAndCount({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
    });
    for (let i = 0; i < result.length; i++) {
      delete result[i].permissions;
    }
    const data = {
      totalRows: total,
      totalPages: Math.ceil(total / limit),
      roles: result,
    };
    return data;
  }

  async findOne(id: string) {
    const result = await this.rolesRepository.findOneBy({ id });
    if (!result) throw new BadRequestException('Role is not exist');
    else return result;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    const isExist = await this.rolesRepository.findOneBy({ id });
    if (!isExist) throw new BadRequestException('Role is not exist');
    else {
      return await this.rolesRepository.save({
        ...isExist,
        ...updateRoleDto,
        updatedBy: user.email,
      });
    }
  }

  async remove(id: string, user: IUser) {
    const isExist = await this.rolesRepository.findOneBy({ id });
    const findAdminRole = await this.rolesRepository.findOneBy({ id: 'R1' });
    if (!isExist || findAdminRole)
      throw new BadRequestException('Role is not exist or role is admin');
    else {
      await this.rolesRepository.save({
        ...isExist,
        deletedBy: user.email,
        isDeleted: true,
      });
      return await this.rolesRepository.softDelete({ id });
    }
  }
}
