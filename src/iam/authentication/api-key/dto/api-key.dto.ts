import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Zapier intergration' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}
