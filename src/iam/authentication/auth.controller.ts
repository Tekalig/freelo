import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { ActiveUser } from '../decorators/active-user.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { LoginTwoFaDto } from './2fa/dto/login-2fa.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Auth(AuthType.None)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.Local)
  @ApiBody({ type: SignInDto })
  @Post('login')
  async signIn(
    @ActiveUser()
    user: { id: string; email: string; emailVerified: boolean; plan: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.signIn(
      user.id,
      user.email,
      user.emailVerified,
      user.plan,
    );

    if ('requiresTwoFactor' in result) {
      return result;
    }

    this.authService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
    );

    return {
      message: 'login successfully!!',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  @Post('login/2fa')
  async loginTwoFa(
    @Body() dto: LoginTwoFaDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.loginWithTwoFactor(dto.pendingToken, dto.code);

    this.authService.setAuthCookies(res, accessToken, refreshToken);

    return {
      message: 'login successfully!!',
    };
  }

  @Auth(AuthType.Refresh)
  @Post('refresh')
  async refresh(
    @ActiveUser()
    user: {
      userId: string;
      email: string;
      refreshToken: string;
    },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshToken(
      user.userId,
      user.email,
      user.refreshToken,
    );

    this.authService.setAuthCookies(res, accessToken, refreshToken);

    return { message: 'Tokens refreshed' };
  }

  @Post('logout')
  async logout(
    @ActiveUser('userId') userId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.logout(userId);

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    return { message: 'Logged out successfully' };
  }
}
