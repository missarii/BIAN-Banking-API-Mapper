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
    if (m.status !== 'ACCEPTED') continue;
    const prev = byApi.get(m.apiId);
    if (!prev || m.score > prev.score) byApi.set(m.apiId, m);
  }
  const mapped = apiIds.filter((id) => byApi.has(id)).length;
  const vals = [...byApi.values()];
  const high = vals.filter((m) => m.confidence === 'HIGH').length;
  const medium = vals.filter((m) => m.confidence === 'MEDIUM').length;
  const low = vals.filter((m) => m.confidence === 'LOW').length;

  const areaTotals = new Map<string, { mapped: number; total: number }>();
  const areaOf = new Map(accepted.map((m) => [m.apiId, m.businessArea] as const));
  for (const id of apiIds) {
    const area = areaOf.get(id) ?? 'Unmapped';
    const row = areaTotals.get(area) ?? { mapped: 0, total: 0 };
    row.total += 1;
    if (byApi.has(id)) row.mapped += 1;
    areaTotals.set(area, row);
  }
  const perArea = [...areaTotals.entries()]
    .map(([area, r]) => ({
      area,
      mapped: r.mapped,
      total: r.total,
      pct: r.total === 0 ? 0 : Math.round((r.mapped / r.total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct || a.area.localeCompare(b.area));

  return {
    totalApis: apiIds.length,
    mapped,
    unmapped: apiIds.length - mapped,
    high,
    medium,
    low,
    coveragePct: apiIds.length === 0 ? 0 : Math.round((mapped / apiIds.length) * 100),
    alignmentPct: mapped === 0 ? 0 : Math.round((high / mapped) * 100),
    perArea,
  };
}
