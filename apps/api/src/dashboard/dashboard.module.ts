import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { coverage, findDuplicates } from '@bian/mapping-engine';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiTags('dashboard')
  @Get()
  async summary() {
    const [apis, accepted, domains] = await Promise.all([
      this.prisma.api.findMany({
        include: { operations: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.mapping.findMany({
        where: { status: 'ACCEPTED' },
        include: { serviceDomain: true },
      }),
      this.prisma.serviceDomain.findMany({ select: { id: true, name: true } }),
    ]);

    const metrics = coverage(
      apis.map((a) => a.id),
      accepted.map((m) => ({
        apiId: m.apiId,
        domainId: m.serviceDomainId,
        domainName: m.serviceDomain.name,
        businessArea: m.serviceDomain.businessArea,
        score: m.score,
        confidence: m.confidence as 'HIGH' | 'MEDIUM' | 'LOW',
        status: 'ACCEPTED' as const,
      })),
    );

    const duplicates = findDuplicates(
      apis.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description ?? undefined,
        baseUrl: a.baseUrl ?? undefined,
        operations: a.operations.map((o) => ({
          method: o.method,
          path: o.path,
          summary: o.summary ?? undefined,
          description: o.description ?? undefined,
        })),
      })),
      0.3,
    ).slice(0, 10);

    const unmapped = apis
      .filter((a) => !accepted.some((m) => m.apiId === a.id))
      .map((a) => ({ id: a.id, name: a.name, operations: a.operations.length }));

    return {
      ...metrics,
      domains: domains.length,
      potentialDuplicates: duplicates.length,
      duplicates,
      unmapped,
    };
  }
}

@Module({ controllers: [DashboardController] })
export class DashboardModule {}
