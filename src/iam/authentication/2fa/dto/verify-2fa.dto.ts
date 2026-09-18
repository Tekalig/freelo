import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyTwoFaDto {
  @ApiProperty()
  @IsString()
  @Length(6, 6)
  token: string;
}
