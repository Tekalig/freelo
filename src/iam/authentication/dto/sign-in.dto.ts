import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ example: 'admin@freelo.dev' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'aflwerijqewriq!' })
  @IsString()
  @MinLength(8)
  password: string;
}
