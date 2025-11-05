/** Shared input/output shapes for the alignment engine. */

export interface BianOperationProfile {
  operationId: string;
  method: string;
  path: string;
  summary: string;
}

export interface ServiceDomainProfile {
  /** Stable identifier (DB id or slug). */
  id: string;
  slug: string;
  name: string;
  description: string;
  businessArea: string;
  keywords: string[];
  controlRecord?: string;
  behaviorQualifiers?: string[];
  operations?: BianOperationProfile[];
}

export interface ApiOperationInput {
  method: string;
  path: string;
  summary?: string;
  description?: string;
}

export interface ApiInput {
  id: string;
  name: string;
  description?: string;
  baseUrl?: string;
  owner?: string;
  operations: ApiOperationInput[];
}

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Recommendation {
  domainId: string;
  domainName: string;
  businessArea: string;
  /** Alignment score, 0..100. This is an analytical metric, NOT a BIAN certification. */
  score: number;
  confidence: Confidence;
  reasons: string[];
  matchedKeywords: string[];
}

export interface ScoreOptions {
  topN?: number;
  minScore?: number;
}
