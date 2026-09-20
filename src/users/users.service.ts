import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from 'src/iam/authorization/roles/entities/role.entity';
import { SocialAccount } from 'src/iam/authentication/social/entities/social-account.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(SocialAccount)
    private readonly socialRepo: Repository<SocialAccount>,
  ) {}

  findAll() {
    return this.usersRepo.find();
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id: id },
      relations: { roles: true },
    });

    if (!user) {
      throw new NotFoundException(`User Not Found!`);
    }
    return user;
  }

  async findByEmail(email: string | undefined) {
    const user = await this.usersRepo.findOne({ where: { email: email } });

    if (!user) {
      throw new NotFoundException(`User Not Found!`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepo.preload({ id: id, ...updateUserDto });

    if (!user) {
      throw new NotFoundException(`User Not Found!`);
    }

    return this.usersRepo.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.usersRepo.remove(user);
  }

  findByIdWithRefreshToken(id: string) {
    return this.usersRepo.findOne({
      where: { id },
      select: { id: true, email: true, hashedRefreshToken: true },
    });
  }

  async updateHashedRefreshToken(
    id: string,
    hashedRefreshToken: string | null,
  ) {
    return await this.usersRepo.update(id, {
      hashedRefreshToken: hashedRefreshToken,
    });
  }

  async assignDefualtRole(userId: string) {
    const defualtRole = await this.roleRepo.findOne({
      where: { name: 'owner' },
    });

    if (!defualtRole) throw new Error('Role Not Found!!');

    const user = await this.findOne(userId);
    user.roles = [defualtRole];
    return this.usersRepo.save(user);
  }

  async assignRole(userId: string, roleId: string) {
    const user = await this.findOne(userId);
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role is Not Found!');

    const alreadyHasRole = user.roles.some((r) => r.id === role.id);
    if (!alreadyHasRole) {
      user.roles.push(role);
      await this.usersRepo.save(user);
    }

    return user;
  }

  async revokeRole(userId: string, roleId: string) {
    const user = await this.findOne(userId);

    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role is Not Found!');

    user.roles = user.roles.filter((r) => r.id !== role.id);
    return this.usersRepo.save(user);
  }

  async findProviderId(provider: string, providerId: string) {
    const socialAccount = await this.socialRepo.findOne({
      where: { provider: provider, providerId: providerId },
      relations: { user: true },
    });

    return socialAccount?.user;
  }

  async linkProviderId(
    userId: string,
    provider: string,
    providerId: string,
    email: string | undefined,
  ) {
    const existing = await this.socialRepo.findOne({
      where: { provider, providerId },
    });

    if (existing) return this.findOne(userId);

    const social = this.socialRepo.create({
      user: { id: userId },
      provider,
      providerId,
      email,
    });

    await this.socialRepo.save(social);

    return this.findOne(userId);
  }

  async createFromSocial(profile: {
    provider: string;
    providerId: string;
    email: string | undefined;
    fullName: string;
  }): Promise<User> {
    const user = this.usersRepo.create({
      fullName: profile.fullName,
      email: profile.email,
      emailVerified: true,
    });

    await this.usersRepo.save(user);

    const social = this.socialRepo.create({
      user: { id: user.id },
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
    });

    await this.socialRepo.save(social);

    return this.findOne(user.id);
  }

  async setTwoFactorSecret(userId: string, secret: string) {
    await this.usersRepo.update(userId, { twoFaSecret: secret });
  }

  async findByIdForFaSecret(userId: string) {
    return await this.usersRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFaSecret: true,
        isTwoFaEnabled: true,
      },
    });
  }

  async enableTwoFactor(userId: string) {
    await this.usersRepo.update(userId, { isTwoFaEnabled: true });
  }

  async disableTwoFactor(userId: string) {
    await this.usersRepo.update(userId, {
      isTwoFaEnabled: false,
      twoFaSecret: null,
    });
  }
}
