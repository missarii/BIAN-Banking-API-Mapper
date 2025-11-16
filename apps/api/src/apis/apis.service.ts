import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiDto } from './dto';

@Injectable()
export class ApisService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string) {
    return this.prisma.api.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { operations: true } },
        mappings: {
          where: { status: 'ACCEPTED' },
          include: { serviceDomain: true },
        },
      },
    });
  }

  async detail(id: string) {
    const api = await this.prisma.api.findUnique({
      where: { id },
      include: {
        operations: true,
        mappings: {
          orderBy: { score: 'desc' },
          include: { serviceDomain: true, reviews: true },
        },
      },
    });
    if (!api) throw new NotFoundException('API not found');
    return api;
  }

  create(dto: CreateApiDto) {
    return this.prisma.api.create({
      data: {
        name: dto.name,
        description: dto.description,
        baseUrl: dto.baseUrl,
        version: dto.version,
        protocol: dto.protocol ?? 'REST',
        owner: dto.owner,
        operations: dto.operations
          ? {
              create: dto.operations.map((o) => ({
                method: o.method.toUpperCase(),
                path: o.path,
                summary: o.summary,
                description: o.description,
              })),
            }
          : undefined,
      },
      include: { operations: true },
    });
  }

  async remove(id: string) {
    await this.detail(id);
    await this.prisma.api.delete({ where: { id } });
    return { deleted: true };
  }
}
