import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApisService } from './apis.service';
import { CreateApiDto } from './dto';

@ApiTags('apis')
@Controller('apis')
export class ApisController {
  constructor(private readonly service: ApisService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.service.list(search);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Post()
  create(@Body() dto: CreateApiDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
