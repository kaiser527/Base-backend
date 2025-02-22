import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { IListUser, IUser } from './users.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async findOnebyUsername(username: string) {
    return await this.usersRepository.findOneBy({ email: username });
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  updateUserToken = async (refreshToken: string, id: number) => {
    const user = await this.usersRepository.findOneBy({ id });
    if (user) {
      return await this.usersRepository.save({ ...user, refreshToken });
    } else {
      throw new BadRequestException('Something went wrong');
    }
  };

  findUserByToken = async (refreshToken: string) => {
    return await this.usersRepository.findOneBy({ refreshToken });
  };

  async create(createUserDto: CreateUserDto, user: IUser) {
    const isExist = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (isExist) throw new BadRequestException('User is already exist');
    const hashPassword = this.getHashPassword(createUserDto.password);
    const create = this.usersRepository.create({
      email: createUserDto.email,
      password: hashPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      age: createUserDto.age,
      gender: createUserDto.gender,
      roleId: createUserDto.roleId,
      createdBy: user.email,
    });
    const result = await this.usersRepository.save(create);
    const newResult = {
      id: result.id,
      createdAt: result.createdAt,
    };
    return newResult;
  }

  async register(createUserDto: RegisterUserDto) {
    const isExist = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (isExist) throw new BadRequestException('User is already exist');
    const hashPassword = this.getHashPassword(createUserDto.password);
    const create = this.usersRepository.create({
      email: createUserDto.email,
      password: hashPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      age: createUserDto.age,
      gender: createUserDto.gender,
      roleId: 'R2',
    });
    const result = await this.usersRepository.save(create);
    const newResult = {
      id: result.id,
      createdAt: result.createdAt,
    };
    return newResult;
  }

  async findAll(limit: number, page: number) {
    const offset = (page - 1) * limit;
    let newResult: IListUser<User>[] = [];
    const [result, total] = await this.usersRepository.findAndCount({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
      select: ['id', 'firstName', 'lastName', 'email', 'gender', 'age'],
    });
    if (result && result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        let newRole = {
          id: result[i].role.id,
          name: result[i].role.name,
        };
        delete result[i].role;
        const newUser = {
          info: result[i],
          role: newRole,
        };
        newResult.push(newUser);
      }
    }
    const data = {
      totalRows: total,
      totalPages: Math.ceil(total / limit),
      users: newResult,
    };
    return data;
  }

  async findOne(id: number) {
    const result = await this.usersRepository.findOneBy({ id });
    const newResult = {
      id: result.id,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      gender: result.gender,
      age: result.age,
      role: {
        id: result.role.id,
        name: result.role.name,
      },
    };
    if (!result) throw new BadRequestException('User is not exist');
    else return newResult;
  }

  async update(id: number, updateUserDto: UpdateUserDto, user: IUser) {
    const isExist = await this.usersRepository.findOneBy({ id });
    if (isExist) {
      return await this.usersRepository.save({
        ...isExist,
        ...updateUserDto,
        updatedBy: user.email,
      });
    } else throw new BadRequestException('User is not exist');
  }

  async remove(id: number, user: IUser) {
    const isExist = await this.usersRepository.findOneBy({ id });
    const findAdminUser = await this.usersRepository.findOneBy({
      roleId: 'R1',
    });
    if (!isExist || findAdminUser)
      throw new BadRequestException('User is not exist or user is admin');
    else {
      await this.usersRepository.save({
        ...isExist,
        deletedBy: user.email,
        isDeleted: true,
      });
      return await this.usersRepository.softDelete({ id });
    }
  }
}
