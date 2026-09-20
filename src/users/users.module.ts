import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from 'src/iam/authorization/roles/entities/role.entity';
import { SocialAccount } from 'src/iam/authentication/social/entities/social-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, SocialAccount])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
