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
  },
  {
    api: {
      id: 'account-api',
      name: 'Account API',
      description: 'Open and service consumer checking accounts and balances.',
      operations: [
        { method: 'POST', path: '/accounts', summary: 'Initiate a new checking account' },
        { method: 'GET', path: '/accounts/{id}/balance', summary: 'Retrieve account balance' },
      ],
    },
    expectTop: 'Current Account',
  },
  {
    api: {
      id: 'card-api',
      name: 'Card API',
      description: 'Authorize and capture card transactions, block lost cards.',
      operations: [
        { method: 'POST', path: '/cards/{id}/authorize', summary: 'Authorize a card transaction' },
        { method: 'POST', path: '/cards/{id}/block', summary: 'Block a lost card' },
      ],
    },
    expectTop: 'Card',
  },
  {
    api: {
      id: 'loan-api',
      name: 'Loan Origination API',
      description: 'Apply for and approve consumer mortgage loans.',
      operations: [
        { method: 'POST', path: '/loans/applications', summary: 'Apply for a mortgage loan' },
        { method: 'POST', path: '/loans/{id}/approve', summary: 'Approve a loan application' },
      ],
    },
    expectTop: 'Loan',
  },
];

describe('real BIAN 14.0 seed sanity', () => {
  const domains = loadRealDomains();
  for (const { api, expectTop } of cases) {
    it(`${api.name} ranks a ${expectTop} domain first`, () => {
      const recs = scoreApi(api, domains, { topN: 5 });
      console.log(
        `${api.name}: ` +
          recs.slice(0, 3).map((r) => `${r.domainName} ${r.score}`).join(' | '),
      );
      expect(recs[0].domainName).toContain(expectTop);
      expect(recs[0].score).toBeGreaterThanOrEqual(40);
    });
  }
});
