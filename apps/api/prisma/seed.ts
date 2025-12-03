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
      owner: 'Payments Platform Team',
      operations: [
        { method: 'POST', path: '/payments', summary: 'Initiate and execute a customer payment' },
        { method: 'GET', path: '/payments/{id}', summary: 'Retrieve payment order status' },
        { method: 'POST', path: '/payments/{id}/cancel', summary: 'Cancel a pending payment order' },
      ],
    },
    {
      name: 'Account API',
      description: 'Open and service consumer checking accounts and balances.',
      baseUrl: '/api/v1/accounts',
      version: '1.2',
      owner: 'Accounts Team',
      operations: [
        { method: 'POST', path: '/accounts', summary: 'Initiate a new checking account' },
        { method: 'GET', path: '/accounts/{id}/balance', summary: 'Retrieve account balance and position' },
      ],
    },
    // Deliberate overlap pair: two teams maintaining near-identical customer
    // capability under different names. Exists so the duplicate/overlap
    // detector has something real to surface on a fresh install — this is
    // the "different teams built the same boundary" story the tool exists
    // to expose.
    {
      name: 'Customer Profile API',
      description: 'Customer profile data and contact details, maintained by the legacy platform.',
      baseUrl: '/api/v1/customer',
      version: '1.0',
      owner: 'Legacy Platform Team',
      operations: [
        { method: 'GET', path: '/customer/profile', summary: 'Retrieve customer profile' },
      ],
    },
    {
      name: 'Customer Details API',
      description: 'Customer details and profile information, maintained by the legacy platform.',
      baseUrl: '/api/v1/customer',
      version: '1.0',
      owner: 'Legacy Platform Team',
      operations: [
        { method: 'GET', path: '/customer/details', summary: 'Retrieve customer details' },
      ],
    },
  ];
  const seededApis: { id: string; name: string }[] = [];
  for (const s of samples) {
    let api = await prisma.api.findFirst({ where: { name: s.name } });
    if (!api) {
      api = await prisma.api.create({
        data: {
          name: s.name,
          description: s.description,
          baseUrl: s.baseUrl,
          version: s.version,
          owner: s.owner,
          operations: { create: s.operations },
        },
      });
    }
    seededApis.push({ id: api.id, name: api.name });
  }
  console.log('Seeded 5 sample internal APIs (incl. a deliberate overlap pair).');

  // ── Demo state ────────────────────────────────────────────────────────────
  // Run the *real* engine over the seeded estate and have the architect accept
  // its top candidate for three of the five APIs. A fresh install is therefore
  // immediately illustrative — coverage, alignment bands, an audit trail and
  // API nodes in the graph — while the two legacy overlap APIs are
  // deliberately left unmapped so the duplicate detector still has something
  // real to surface. Every score below is produced by the engine, not hardcoded.
  const DEMO_ACCEPTS = new Set(['Customer Management API', 'Payment API', 'Account API']);
  const architect = await prisma.user.findUnique({
    where: { email: 'architect@bank.example' },
  });

  for (const s of samples) {
    const api = seededApis.find((a) => a.name === s.name);
    if (!api) continue;

    const recommendations = scoreApi(
      {
        id: api.id,
        name: s.name,
        description: s.description,
        baseUrl: s.baseUrl,
        operations: s.operations,
      },
      profiles,
      { topN: 5 },
    );

    const acceptTop = DEMO_ACCEPTS.has(s.name);

    for (const [index, r] of recommendations.entries()) {
      const accepted = acceptTop && index === 0;
      const mapping = await prisma.mapping.upsert({
        where: {
          apiId_serviceDomainId: { apiId: api.id, serviceDomainId: r.domainId },
        },
        update: {
          score: r.score,
          confidence: r.confidence,
          ...(accepted ? { status: 'ACCEPTED' as const } : {}),
        },
        create: {
          apiId: api.id,
          serviceDomainId: r.domainId,
          score: r.score,
          confidence: r.confidence,
          status: accepted ? 'ACCEPTED' : 'CANDIDATE',
        },
      });

      if (accepted && architect) {
        const alreadyReviewed = await prisma.mappingReview.findFirst({
          where: { mappingId: mapping.id },
        });
        if (!alreadyReviewed) {
          await prisma.mappingReview.create({
            data: {
              mappingId: mapping.id,
              reviewerId: architect.id,
              decision: 'ACCEPT',
              comment: 'Seeded demo decision — accepted during architecture review.',
            },
          });
        }
      }
    }
  }

  const acceptedCount = await prisma.mapping.count({ where: { status: 'ACCEPTED' } });
  console.log(
    `Engine-generated candidates persisted; ${acceptedCount} mapping(s) ACCEPTED with an audit trail.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
