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
            score: r.score,
            confidence: r.confidence,
            status: 'CANDIDATE',
          },
        }),
      ),
    );

    return { apiId: api.id, recommendations };
  }

  async review(dto: ReviewDto, reviewerEmail?: string) {
    const api = await this.prisma.api.findUnique({ where: { id: dto.apiId } });
    if (!api) throw new NotFoundException('API not found');

    const targetId =
      dto.decision === 'CHANGE' ? (dto.newServiceDomainId ?? dto.serviceDomainId) : dto.serviceDomainId;
    const target = await this.prisma.serviceDomain.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('Service domain not found');

    const mapping = await this.prisma.mapping.upsert({
      where: {
        apiId_serviceDomainId: { apiId: dto.apiId, serviceDomainId: target.id },
      },
      update: {
        status: dto.decision === 'REJECT' ? 'REJECTED' : 'ACCEPTED',
      },
      create: {
        apiId: dto.apiId,
        serviceDomainId: target.id,
        score: 0,
        confidence: 'LOW',
        status: dto.decision === 'REJECT' ? 'REJECTED' : 'ACCEPTED',
      },
    });

    // A rejection / manual change should not leave stale ACCEPTED rows behind.
    if (dto.decision === 'REJECT') {
      await this.prisma.mapping.updateMany({
        where: { apiId: dto.apiId, id: { not: mapping.id } },
        data: { status: 'REJECTED' },
      });
    } else {
      await this.prisma.mapping.updateMany({
        where: { apiId: dto.apiId, id: { not: mapping.id }, status: 'ACCEPTED' },
        data: { status: 'CANDIDATE' },
      });
    }

    const reviewer = reviewerEmail
      ? await this.prisma.user.findUnique({ where: { email: reviewerEmail } })
      : null;

    if (reviewer) {
      await this.prisma.mappingReview.create({
        data: {
          mappingId: mapping.id,
          reviewerId: reviewer.id,
          decision: dto.decision,
          comment: dto.comment,
        },
      });
    }

    return this.prisma.mapping.findUnique({
      where: { id: mapping.id },
      include: { serviceDomain: true },
    });
  }

  /**
   * Score order matches the engine's own ranking (`scoring.ts` breaks score
   * ties by domain name). Without the secondary key a 75/75 tie — e.g. Payment
   * Order Initiation vs Standing Order — returns in arbitrary order, so the
   * first row would not reliably be the engine's top candidate.
   */
  listForApi(apiId: string) {
    return this.prisma.mapping.findMany({
      where: { apiId },
      orderBy: [{ score: 'desc' }, { serviceDomain: { name: 'asc' } }],
      include: { serviceDomain: true, reviews: true },
    });
  }
}
