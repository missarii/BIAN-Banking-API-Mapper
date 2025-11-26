import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard'),
  });

  return (
    <Layout>
      <h1 className="text-xl font-bold">BIAN Alignment Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Analytical metrics from this tool — not BIAN certification scores.
      </p>
      {isLoading && <p className="mt-6 text-sm">Loading…</p>}
      {error && <p className="mt-6 text-sm text-rose-600">{String(error)}</p>}
      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Total APIs', data.totalApis],
              ['Mapped', data.mapped],
              ['Unmapped', data.unmapped],
              ['Coverage', `${data.coveragePct}%`],
              ['High alignment', data.high],
              ['Medium', data.medium],
              ['Low', data.low],
              ['Potential duplicates', data.potentialDuplicates],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-white p-4">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h2 className="text-sm font-semibold">Service Domain coverage</h2>
              <div className="mt-3 space-y-2">
                {(data.perArea ?? []).map((r: any) => (
                  <div key={r.area} className="text-sm">
                    <div className="flex justify-between">
                      <span>{r.area}</span>
                      <span className="text-slate-500">
