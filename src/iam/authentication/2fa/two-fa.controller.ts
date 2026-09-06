import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TwoFaService } from './two-fa.service';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { VerifyTwoFaDto } from './dto/verify-2fa.dto';
import express from 'express';
import { toFileStream } from 'qrcode';

@ApiTags('Authentication')
@Controller('auth/2fa')
export class TwoFaController {
  constructor(private readonly twoFaService: TwoFaService) {}

  @Post('generate')
  async generateSecret(
    @ActiveUser() user: { userId: string; email: string },
    @Res() res: express.Response,
  ) {
    const url = await this.twoFaService.generateSecretForUser(
      user.userId,
      user.email,
    );

    res.type('png');
    return toFileStream(res, url);
  }

  @Post('enable')
  enable(@ActiveUser('userId') userId: string, @Body() dto: VerifyTwoFaDto) {
    return this.twoFaService.verfiyAndEnable(userId, dto.token);
  }

  @Post('disable')
  disable(@ActiveUser('userId') userId: string) {
    return this.twoFaService.disable(userId);
  }
}
