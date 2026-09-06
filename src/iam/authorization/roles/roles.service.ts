import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const exists = await this.roleRepo.findOne({
      where: { name: createRoleDto.name },
    });

    if (exists) throw new ConflictException('Role with name already exists.');

    const role = this.roleRepo.create(createRoleDto);
    return this.roleRepo.save(role);
  }

  findAll() {
    return this.roleRepo.find();
  }

  async findOne(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });

    if (!role) throw new NotFoundException('Role is Not Found!');

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepo.preload({ id: id, ...updateRoleDto });

    if (!role) throw new NotFoundException('Roles is Not Found!');

    return this.roleRepo.save(role);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    return this.roleRepo.remove(role);
  }

  async attachPermission(roleId: string, permissionId: string) {
    const role = await this.findOne(roleId);

    const permission = await this.permissionRepo.findOne({
      where: { id: permissionId },
    });
    if (!permission) throw new NotFoundException('Permission Not Found!!');

    const already = role.permissions.some((p) => p.id === permission.id);
    if (!already) {
      role.permissions.push(permission);
      await this.roleRepo.save(role);
    }

    return role;
  }

  async detachPermission(roleId: string, permissionId: string) {
    const role = await this.findOne(roleId);

    const permission = await this.permissionRepo.findOne({
      where: { id: permissionId },
    });
    if (!permission) throw new NotFoundException('Permission Not Found!!');

    role.permissions = role.permissions.filter((p) => p.id !== permission.id);

    return this.roleRepo.save(role);
  }
}
