import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MappingsService } from './mappings.service';
import { AnalyzeDto, ReviewDto } from './dto';

@ApiTags('mappings')
@Controller('mappings')
export class MappingsController {
  constructor(private readonly service: MappingsService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeDto) {
    return this.service.analyze(dto);
  }

  /**
   * The one write action that changes what the organisation treats as its
   * architecture: accepting/rejecting a mapping. Guarded and audited.
   */
  @Post('review')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ARCHITECT')
  review(@Body() dto: ReviewDto, @Req() req: any) {
    return this.service.review(dto, req.user?.email);
  }

  @Get('api/:apiId')
  listForApi(@Param('apiId') apiId: string) {
    return this.service.listForApi(apiId);
  }
}
