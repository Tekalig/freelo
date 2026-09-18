import { Body, Controller, Post, Req, Res } from '@nestjs/common';
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
  async googleLogin(@Body() dto: GoogleTokenDto, @Req() req: express.Request) {
    const user = await this.socialService.loginWithGoodle(dto.token);

    return this.authService.signIn(user, req);
  }
}
