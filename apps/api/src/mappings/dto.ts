import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeDto {
  @ApiProperty({ example: 'payment-api-id' })
  @IsString()
  @IsNotEmpty()
  apiId!: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  topN?: number;
}

export class ReviewDto {
  @ApiProperty({ example: 'payment-api-id' })
  @IsString()
  @IsNotEmpty()
  apiId!: string;

  @ApiProperty({ example: 'service-domain-id' })
  @IsString()
  @IsNotEmpty()
  serviceDomainId!: string;

  /**
   * Restricted to the three decisions the service understands. Without
   * `IsIn`, any string reaches `MappingsService.review`, which treats
   * anything that is not `REJECT` as an acceptance — a caller could silently
   * flip a mapping to ACCEPTED.
   */
  @ApiProperty({ enum: ['ACCEPT', 'REJECT', 'CHANGE'], example: 'ACCEPT' })
  @IsString()
  @IsIn(['ACCEPT', 'REJECT', 'CHANGE'])
  decision!: 'ACCEPT' | 'REJECT' | 'CHANGE';

  @ApiPropertyOptional({ example: 'Verified against the payments landscape.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Required when decision=CHANGE' })
  @IsOptional()
  @IsString()
  newServiceDomainId?: string;
}
