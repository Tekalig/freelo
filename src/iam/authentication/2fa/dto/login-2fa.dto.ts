import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LoginTwoFaDto {
  @ApiProperty()
  @IsString()
  pendingToken: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  code: string;
}
