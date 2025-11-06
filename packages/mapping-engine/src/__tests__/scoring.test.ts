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
