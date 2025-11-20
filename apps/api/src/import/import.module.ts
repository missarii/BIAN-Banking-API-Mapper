import { Controller, Module, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ImportService } from './import.service';

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @Post('openapi')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.service.importOpenApi(file);
  }
}

@Module({
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
