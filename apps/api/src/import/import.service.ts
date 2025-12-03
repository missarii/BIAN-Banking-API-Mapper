import { BadRequestException, Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { PrismaService } from '../prisma/prisma.service';

interface OpenApiDoc {
  openapi?: string;
  info?: { title?: string; description?: string; version?: string };
  paths?: Record<string, Record<string, any>>;
}

/** Parse an uploaded OpenAPI 3.x / 2.x document into API + operations. */
@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importOpenApi(file?: Express.Multer.File) {
    if (!file?.buffer) throw new BadRequestException('No file uploaded');
    const raw = file.buffer.toString('utf-8');
    let doc: OpenApiDoc;
    try {
      doc = file.originalname.match(/\.ya?ml$/i)
        ? (yaml.load(raw) as OpenApiDoc)
        : (JSON.parse(raw) as OpenApiDoc);
    } catch {
      throw new BadRequestException('File is not valid JSON/YAML');
    }
    if (!doc || typeof doc !== 'object' || !doc.paths) {
      throw new BadRequestException('Not an OpenAPI document: missing "paths"');
    }

    const endpoints = this.extractEndpoints(doc);
    const api = await this.prisma.api.create({
      data: {
        name: doc.info?.title ?? file.originalname.replace(/\.[^.]+$/, ''),
        description: doc.info?.description,
        version: doc.info?.version,
        protocol: 'REST',
        owner: 'OpenAPI import',
        openApiDocument: doc as any,
        operations: {
          create: endpoints.map((e) => ({
            method: e.method,
            path: e.path,
            summary: e.summary,
            description: e.description,
          })),
        },
      },
      include: { _count: { select: { operations: true } } },
    });

    return {
      apiId: api.id,
      apiName: api.name,
      imported: endpoints.length,
    };
  }

  private extractEndpoints(doc: OpenApiDoc) {
    const out: { method: string; path: string; summary?: string; description?: string }[] = [];
    for (const [path, item] of Object.entries(doc.paths ?? {})) {
      if (!item || typeof item !== 'object') continue;
      for (const [method, op] of Object.entries(item)) {
        if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
          continue;
        }
        const o = (op ?? {}) as Record<string, any>;
        out.push({
          method: method.toUpperCase(),
          path,
          summary: o.summary ?? o.operationId,
          description: o.description,
        });
      }
    }
    return out;
  }
}
