import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiOperationDto {
  @ApiProperty({ example: 'POST' })
  @IsString()
  method!: string;

  @ApiProperty({ example: '/payments' })
  @IsString()
  path!: string;

  @ApiPropertyOptional({ example: 'Initiate a customer payment' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateApiDto {
  @ApiProperty({ example: 'Payment API' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '/api/v1/payments' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ example: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 'REST' })
  @IsOptional()
  @IsString()
  protocol?: string;

  @ApiPropertyOptional({ example: 'Payments Platform Team' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ type: [ApiOperationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApiOperationDto)
  operations?: ApiOperationDto[];
}
