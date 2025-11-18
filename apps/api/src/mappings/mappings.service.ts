import { Injectable, NotFoundException } from '@nestjs/common';
import {
  scoreApi,
  type ApiInput,
  type ServiceDomainProfile,
} from '@bian/mapping-engine';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeDto, ReviewDto } from './dto';

/**
 * Human-in-the-loop mapping: the engine produces alignment candidates,
 * the architect accepts/rejects/changes them. Candidates are persisted as
 * Mapping(status=CANDIDATE); review flips them to ACCEPTED/REJECTED.
 */
@Injectable()
export class MappingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async profiles(): Promise<ServiceDomainProfile[]> {
    const domains = await this.prisma.serviceDomain.findMany({
      orderBy: { name: 'asc' },
    });
    return domains.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      description: d.description,
      businessArea: d.businessArea,
      keywords: d.keywords,
      controlRecord: d.controlRecord ?? undefined,
      behaviorQualifiers: d.behaviorQualifiers,
      operations: (d.bianOperations as any)?.operations ?? [],
    }));
  }

  private async apiInput(apiId: string): Promise<ApiInput> {
    const api = await this.prisma.api.findUnique({
      where: { id: apiId },
      include: { operations: true },
    });
    if (!api) throw new NotFoundException('API not found');
    return {
      id: api.id,
      name: api.name,
      description: api.description ?? undefined,
      baseUrl: api.baseUrl ?? undefined,
      owner: api.owner ?? undefined,
      operations: api.operations.map((o) => ({
        method: o.method,
        path: o.path,
        summary: o.summary ?? undefined,
        description: o.description ?? undefined,
      })),
    };
  }

  async analyze(dto: AnalyzeDto) {
    const api = await this.apiInput(dto.apiId);
    const recommendations = scoreApi(api, await this.profiles(), {
      topN: dto.topN ?? 5,
    });

    await this.prisma.$transaction(
      recommendations.map((r) =>
        this.prisma.mapping.upsert({
          where: {
            apiId_serviceDomainId: {
              apiId: api.id,
              serviceDomainId: r.domainId,
            },
          },
          update: { score: r.score, confidence: r.confidence },
          create: {
            apiId: api.id,
            serviceDomainId: r.domainId,
