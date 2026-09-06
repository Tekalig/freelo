import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'besu mesfin' })
  @IsString()
  full_name: string;

  @ApiProperty({ example: 'test@test.com' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'asdfasldfasid121' })
  @IsString()
  @MinLength(8)
  password: string;
}
