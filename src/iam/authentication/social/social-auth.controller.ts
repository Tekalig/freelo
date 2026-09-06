import { Body, Controller, Post, Res } from '@nestjs/common';
import { SocialAuthService } from './social-auth.service';
import { GoogleTokenDto } from './dto/google-token.dto';
import { AuthService } from '../auth.service';
import express from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class SocialAuthController {
  constructor(
    private readonly socialService: SocialAuthService,
    private readonly authService: AuthService,
  ) {}

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleTokenDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = await this.socialService.loginWithGoodle(dto.token);

    const result = await this.authService.signIn(
      user!.id,
      user!.email,
      user!.emailVerified,
      user!.plan,
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
}
