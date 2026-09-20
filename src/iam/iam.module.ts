import { Module } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypto.service';
import { AuthController } from './authentication/auth.controller';
import { AuthService } from './authentication/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { LocalStrategy } from './authentication/strategies/local.strategy';
import { APP_GUARD } from '@nestjs/core';
import { LocalGuard } from './authentication/guards/local.guard';
import { AuthenticationGuard } from './authentication/guards/authentication.guard';
import { UsersService } from 'src/users/users.service';
import { RolesModule } from './authorization/roles/roles.module';
import { Role } from './authorization/roles/entities/role.entity';
import { PermissionModule } from './authorization/permission/permission.module';
import { PoliciesGuard } from './authorization/guards/policies.guard';
import { CaslAbilityFactory } from './authorization/factory/casl-ability.factory';
import { ApiKeyService } from './authentication/api-key/api-key.service';
import { ApiKey } from './authentication/api-key/entities/api-key.entity';
import { ApiKeyGuard } from './authentication/guards/api-key.guard';
import { ApiKeyController } from './authentication/api-key/api-key.controller';
import { RequireClaimGuard } from './authentication/guards/require-claim.guard';
import { SocialAccount } from './authentication/social/entities/social-account.entity';
import { SocialAuthController } from './authentication/social/social-auth.controller';
import { SocialAuthService } from './authentication/social/social-auth.service';
import { TwoFaService } from './authentication/2fa/two-fa.service';
import { TwoFaController } from './authentication/2fa/two-fa.controller';
import googleConfig from 'src/config/google.config';
import { UserSerializer } from './authentication/serializer/user-serializer';
import { SessionGuard } from './authentication/guards/session.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, ApiKey, SocialAccount]),
    ConfigModule.forFeature(googleConfig),
    PassportModule.register({ session: true }),
    RolesModule,
    PermissionModule,
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    ApiKeyGuard,
    RequireClaimGuard,
    LocalGuard,
    AuthService,
    LocalStrategy,
    UsersService,
    CaslAbilityFactory,
    ApiKeyService,
    SocialAuthService,
    TwoFaService,
    UserSerializer,
    SessionGuard,
  ],
  controllers: [
    AuthController,
    ApiKeyController,
    SocialAuthController,
    TwoFaController,
  ],
  exports: [CaslAbilityFactory],
})
export class IamModule {}
