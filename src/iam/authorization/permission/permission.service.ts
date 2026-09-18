import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  create(createPermissionDto: CreatePermissionDto) {
    const permission = this.permissionRepo.create(createPermissionDto);
    return this.permissionRepo.save(permission);
  }

  findAll() {
    return this.permissionRepo.find();
  }

  async findOne(id: string) {
    const permission = await this.permissionRepo.findOne({ where: { id: id } });
    if (!permission) throw new NotFoundException('Permission Not Found!!');

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.permissionRepo.preload({
      id,
      ...updatePermissionDto,
    });
    if (!permission) throw new NotFoundException('Permission Not Found!!');

    return this.permissionRepo.save(permission);
  }

  async remove(id: string) {
    const permission = await this.findOne(id);
    return this.permissionRepo.remove(permission);
  }
}
