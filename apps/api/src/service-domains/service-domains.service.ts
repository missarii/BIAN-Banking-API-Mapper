import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceDomainsService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string, businessArea?: string) {
    return this.prisma.serviceDomain.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(businessArea ? { businessArea } : {}),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { mappings: true } } },
    });
  }

  areas() {
    return this.prisma.serviceDomain.groupBy({
      by: ['businessArea'],
      _count: { businessArea: true },
      orderBy: { businessArea: 'asc' },
    });
  }

  async detail(idOrSlug: string) {
    const domain = await this.prisma.serviceDomain.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        outgoing: { include: { target: true } },
        incoming: { include: { source: true } },
        mappings: {
          where: { status: 'ACCEPTED' },
          include: { api: { include: { operations: true } } },
        },
      },
    });
    return domain;
  }
}
