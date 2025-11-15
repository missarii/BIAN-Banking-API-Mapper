import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceDomainsService } from './service-domains.service';

@ApiTags('service-domains')
@Controller('service-domains')
export class ServiceDomainsController {
  constructor(private readonly service: ServiceDomainsService) {}

  @Get()
  list(@Query('search') search?: string, @Query('area') area?: string) {
    return this.service.list(search, area);
  }

  @Get('areas')
  areas() {
    return this.service.areas();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }
}
