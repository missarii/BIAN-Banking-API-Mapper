import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServiceDomainsModule } from './service-domains/service-domains.module';
import { ApisModule } from './apis/apis.module';
import { MappingsModule } from './mappings/mappings.module';
import { ImportModule } from './import/import.module';
import { ArchitectureModule } from './architecture/architecture.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ServiceDomainsModule,
    ApisModule,
    MappingsModule,
    ImportModule,
    ArchitectureModule,
    DashboardModule,
  ],
})
export class AppModule {}
