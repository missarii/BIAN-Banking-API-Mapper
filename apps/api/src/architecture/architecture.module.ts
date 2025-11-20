import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

export interface GraphNode {
  id: string;
  type: 'domain' | 'api';
  label: string;
  area?: string;
  score?: number;
  confidence?: string;
  status?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: 'maps-to' | 'depends-on';
}

@Controller('architecture')
export class ArchitectureController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiTags('architecture')
  @Get('graph')
  async graph(@Query('area') area?: string) {
    const domains = await this.prisma.serviceDomain.findMany({
      where: area ? { businessArea: area } : undefined,
      include: {
        outgoing: true,
        mappings: {
          where: { status: 'ACCEPTED' },
          include: { api: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const seenApis = new Set<string>();
    const domainIds = new Set(domains.map((d) => d.id));

    for (const d of domains) {
      nodes.push({ id: `sd:${d.id}`, type: 'domain', label: d.name, area: d.businessArea });
      for (const dep of d.outgoing) {
        if (domainIds.has(dep.targetId)) {
          edges.push({ source: `sd:${d.id}`, target: `sd:${dep.targetId}`, kind: 'depends-on' });
        }
      }
      for (const m of d.mappings) {
        if (!seenApis.has(m.api.id)) {
          seenApis.add(m.api.id);
          nodes.push({ id: `api:${m.api.id}`, type: 'api', label: m.api.name });
        }
        edges.push({
          source: `api:${m.api.id}`,
          target: `sd:${d.id}`,
          kind: 'maps-to',
        });
      }
    }
    return { nodes, edges };
  }
}

@Module({ controllers: [ArchitectureController] })
export class ArchitectureModule {}
