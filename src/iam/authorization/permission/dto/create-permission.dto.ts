import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'manage' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'Client' })
  @IsString()
  subject: string;

  @ApiProperty({ required: false, example: { 'user.id': '$userId' } })
  @IsOptional()
  @IsObject()
  conditions: Record<string, any>;
}
