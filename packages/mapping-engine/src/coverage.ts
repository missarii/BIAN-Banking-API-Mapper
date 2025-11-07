import type { Confidence } from './types';

export interface MappingRecord {
  apiId: string;
  domainId: string;
  domainName: string;
  businessArea: string;
  score: number;
  confidence: Confidence;
  status: 'ACCEPTED' | 'CANDIDATE' | 'REJECTED';
}

export interface CoverageMetrics {
  totalApis: number;
  mapped: number;
  unmapped: number;
  high: number;
  medium: number;
  low: number;
  coveragePct: number;
  /** Share of *accepted* mappings with HIGH confidence. */
  alignmentPct: number;
  perArea: { area: string; mapped: number; total: number; pct: number }[];
}

/**
 * Alignment dashboard metrics. Pure arithmetic over accepted mappings —
 * deliberately labelled as this tool's analytical metrics, never BIAN's.
 */
export function coverage(
  apiIds: string[],
  accepted: MappingRecord[],
): CoverageMetrics {
  const byApi = new Map<string, MappingRecord>();
  for (const m of accepted) {
