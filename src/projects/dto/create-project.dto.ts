import { ApiProperty } from '@nestjs/swagger';
import {
  IsCurrency,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ProjectStatus } from '../enums/project-status.enum';

export class CreateProjectDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ required: false, example: '75.00' })
  @IsDecimal()
  @IsOptional()
  hourlyRate?: string;

  @ApiProperty({ required: false, default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;
}
