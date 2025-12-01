import { describe, expect, it } from 'vitest';
import {
  findDuplicates,
  scoreApi,
  type ApiInput,
  type ServiceDomainProfile,
} from '../index';

const domains: ServiceDomainProfile[] = [
  {
    id: 'payment-order-initiation',
    slug: 'paymentorderinitiation',
    name: 'Payment Order Initiation',
    description:
      'Initiates payment orders and instructions including customer transfers.',
    businessArea: 'Payments',
    keywords: ['payment', 'order', 'initiate', 'instruction', 'transfer'],
    operations: [
      {
        operationId: 'Initiate',
        method: 'POST',
        path: '/PaymentOrderInitiation/Initiate',
        summary: 'Initiate a payment order',
      },
      {
        operationId: 'Retrieve',
        method: 'GET',
        path: '/PaymentOrderInitiation/{id}/Retrieve',
        summary: 'Retrieve a payment order',
      },
    ],
  },
  {
    id: 'party-reference-data-directory',
    slug: 'partyreferencedatadirectory',
    name: 'Party Reference Data Directory',
    description: 'Maintains party reference information for customers.',
    businessArea: 'Customer',
    keywords: ['party', 'customer', 'reference', 'directory', 'profile'],
    operations: [
      {
        operationId: 'Register',
        method: 'POST',
        path: '/PartyReferenceDataDirectory/Register',
        summary: 'Register a customer entity',
      },
    ],
  },
  {
    id: 'fraud-evaluation',
    slug: 'fraudevaluation',
    name: 'Fraud Evaluation',
    description: 'Evaluates transactions for fraud risk.',
    businessArea: 'Risk & Compliance',
    keywords: ['fraud', 'risk', 'evaluate', 'transaction', 'score'],
  },
];

const paymentApi: ApiInput = {
  id: 'payment-api',
  name: 'Payment API',
  description: 'Execute customer payment transactions and transfers',
  baseUrl: '/api/v1/payments',
  operations: [
    {
      method: 'POST',
      path: '/payments',
      summary: 'Initiate a customer payment transfer',
    },
    {
      method: 'GET',
      path: '/payments/{id}',
      summary: 'Retrieve payment status',
    },
  ],
};

describe('scoreApi', () => {
  it('ranks the payment domain first for a payment API', () => {
    const recs = scoreApi(paymentApi, domains, { topN: 3 });
    expect(recs).toHaveLength(3);
    expect(recs[0].domainName).toBe('Payment Order Initiation');
    expect(recs[0].score).toBeGreaterThan(recs[1].score);
    expect(recs[0].confidence).toMatch(/HIGH|MEDIUM/);
    expect(recs[0].reasons.length).toBeGreaterThan(0);
    expect(recs[0].matchedKeywords).toContain('payment');
  });

  it('keeps scores inside 0..100 and honours topN', () => {
    const recs = scoreApi(paymentApi, domains, { topN: 1 });
    expect(recs).toHaveLength(1);
    for (const r of recs) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it('maps a customer API to the party domain', () => {
    const recs = scoreApi(
      {
        id: 'customer-api',
        name: 'Customer Management API',
        description: 'Manage customer profiles and directory entries',
        operations: [
          { method: 'POST', path: '/customers', summary: 'Register a customer' },
          { method: 'GET', path: '/customers/{id}', summary: 'Retrieve customer' },
        ],
      },
      domains,
      { topN: 1 },
    );
    expect(recs[0].domainName).toBe('Party Reference Data Directory');
  });
});

describe('findDuplicates', () => {
  const customerLike: ApiInput = {
    id: 'a',
    name: 'Customer Profile API',
    description: 'Customer profile data and details',
    operations: [{ method: 'GET', path: '/customer/profile', summary: 'customer profile' }],
  };
  const customerLike2: ApiInput = {
    id: 'b',
    name: 'Customer Details API',
    description: 'Customer details and profile information',
    operations: [{ method: 'GET', path: '/customer/details', summary: 'customer details' }],
  };
  const payments: ApiInput = {
    id: 'c',
    name: 'Payment API',
    description: 'Execute payment transactions',
    operations: [{ method: 'POST', path: '/payments', summary: 'execute payment' }],
  };

  it('flags overlapping customer APIs but not the payment API', () => {
    const pairs = findDuplicates([customerLike, customerLike2, payments], 0.3);
    const flagged = new Set(pairs.flatMap((p) => [p.aId, p.bId]));
    expect(flagged.has('a')).toBe(true);
    expect(flagged.has('b')).toBe(true);
    expect(pairs.some((p) => p.aId === 'c' || p.bId === 'c')).toBe(false);
  });
});
