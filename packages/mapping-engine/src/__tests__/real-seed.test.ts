import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { scoreApi, type ApiInput, type ServiceDomainProfile } from '../index';

function loadRealDomains(): ServiceDomainProfile[] {
  const p = path.join(__dirname, '..', '..', '..', '..', 'seed', 'bian-service-domains.json');
  const seed = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return seed.domains.map((d: any) => ({
    id: d.slug,
    slug: d.slug,
    name: d.name,
    description: d.description,
    businessArea: d.businessArea,
    keywords: d.keywords,
    operations: d.operations,
  }));
}

const cases: { api: ApiInput; expectTop: string }[] = [
  {
    api: {
      id: 'payment-api',
      name: 'Payment API',
      description: 'Execute customer payment transactions and transfers.',
      baseUrl: '/api/v1/payments',
      operations: [
        { method: 'POST', path: '/payments', summary: 'Initiate and execute a customer payment' },
        { method: 'GET', path: '/payments/{id}', summary: 'Retrieve payment order status' },
        { method: 'POST', path: '/payments/{id}/cancel', summary: 'Cancel a pending payment order' },
      ],
    },
    expectTop: 'Payment',
  },
  {
    api: {
      id: 'customer-api',
      name: 'Customer Management API',
      description: 'Manage customer profiles, directory entries and contact details.',
      operations: [
        { method: 'POST', path: '/customers', summary: 'Register a new customer profile' },
        { method: 'GET', path: '/customers/{id}', summary: 'Retrieve customer directory entry' },
      ],
    },
    expectTop: 'Party Reference Data Directory',
