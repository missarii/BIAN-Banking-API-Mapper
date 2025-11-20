/**
 * Prisma seed: Service Domains from seed/bian-service-domains.json
 * (BIAN 14.0.0 names/purposes/operations, curated areas + demo edges),
 * demo users, and five sample internal APIs with operations.
 *
 * Run: pnpm --filter @bian/api prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { scoreApi, type ServiceDomainProfile } from '@bian/mapping-engine';

const prisma = new PrismaClient();

async function main() {
  const seedPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'seed',
    'bian-service-domains.json',
  );
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  console.log(`Seeding ${seed.count} Service Domains (BIAN ${seed.version})...`);

  const idByFile = new Map<string, string>();
  for (const d of seed.domains) {
    const row = await prisma.serviceDomain.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        description: d.description,
        businessArea: d.businessArea,
        keywords: d.keywords,
        controlRecord: d.controlRecord || null,
        behaviorQualifiers: d.behaviorQualifiers ?? [],
        bianOperations: { operations: d.operations ?? [] },
        bianVersion: d.bianVersion ?? seed.version,
        sourceUrl: d.sourceUrl,
      },
      create: {
        slug: d.slug,
        name: d.name,
        description: d.description,
        businessArea: d.businessArea,
        keywords: d.keywords,
        controlRecord: d.controlRecord || null,
        behaviorQualifiers: d.behaviorQualifiers ?? [],
        bianOperations: { operations: d.operations ?? [] },
        bianVersion: d.bianVersion ?? seed.version,
        sourceUrl: d.sourceUrl,
      },
    });
    idByFile.set(d.file, row.id);
  }

  let depCount = 0;
  for (const d of seed.domains) {
    const sourceId = idByFile.get(d.file);
    for (const targetFile of d.dependencies ?? []) {
      const targetId = idByFile.get(targetFile);
      if (!sourceId || !targetId || sourceId === targetId) continue;
      await prisma.dependency.upsert({
        where: { sourceId_targetId: { sourceId, targetId } },
        update: {},
        create: { sourceId, targetId, kind: 'depends-on' },
      });
      depCount++;
    }
  }
  console.log(`Seeded ${depCount} dependency edges.`);

  // Engine profiles keyed by the *database* id, so recommendations come back
  // ready to persist as Mapping rows.
  const profiles: ServiceDomainProfile[] = seed.domains.map((d: any) => ({
    id: idByFile.get(d.file) as string,
    slug: d.slug,
    name: d.name,
    description: d.description,
    businessArea: d.businessArea,
    keywords: d.keywords,
    controlRecord: d.controlRecord ?? undefined,
    behaviorQualifiers: d.behaviorQualifiers ?? [],
    operations: d.operations ?? [],
  }));

  const users = [
    { name: 'Ada Architect', email: 'architect@bank.example', role: 'ARCHITECT' as const, password: 'architect123' },
    { name: 'Omar Admin', email: 'admin@bank.example', role: 'ADMIN' as const, password: 'admin12345' },
    { name: 'Vera Viewer', email: 'viewer@bank.example', role: 'VIEWER' as const, password: 'viewer1234' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: await bcrypt.hash(u.password, 10) },
    });
  }
  console.log('Seeded demo users (architect/admin/viewer).');

  const samples = [
    {
      name: 'Customer Management API',
      description: 'Manage customer profiles, directory entries and contact details.',
      baseUrl: '/api/v1/customers',
      version: '1.0',
      owner: 'Customer Platform Team',
      operations: [
        { method: 'POST', path: '/customers', summary: 'Register a new customer profile' },
        { method: 'GET', path: '/customers/{id}', summary: 'Retrieve customer directory entry' },
        { method: 'PUT', path: '/customers/{id}', summary: 'Update customer reference details' },
      ],
    },
    {
      name: 'Payment API',
      description: 'Execute customer payment transactions and transfers.',
      baseUrl: '/api/v1/payments',
      version: '2.0',
