import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import express from 'express';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { ActiveUser } from '../decorators/active-user.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyTwoFaDto } from './2fa/dto/verify-2fa.dto';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';

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
  async login(
    @ActiveUser()
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      plan: string;
      isTwoFaEnabled: boolean;
    },
    @Req() req: express.Request,
  ) {
    return this.authService.signIn(user, req);
  }

  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  @ApiBody({ type: VerifyTwoFaDto })
  @Post('login/2fa')
  async loginTwoFa(
    @Body() dto: { token: string },
    @Req() req: express.Request,
  ) {
    return this.authService.loginWithTwoFactor(dto.token, req);
  }

  @Post('logout')
  logout(
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    return new Promise((resolve) => {
      req.session.destroy(() => {
        res.clearCookie('connect.id');
        resolve('Loggout Successfully!!');
      });
    });
  }
}
