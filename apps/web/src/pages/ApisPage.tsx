import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export function ApisPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['apis', search],
    queryFn: () => api.get(`/apis${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  return (
    <Layout>
      <h1 className="text-xl font-bold">Internal API Registry</h1>
      <p className="mt-1 text-sm text-slate-500">
        Bank-owned APIs to align against BIAN Service Domains · {data?.length ?? '…'} registered
      </p>
      <div className="mt-4 flex gap-2">
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Search APIs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="shrink-0 rounded-lg border px-3 py-2 text-sm"
          onClick={() => refetch()}
        >
          Refresh
        </button>
        <Link
          to="/mapping"
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          + Map API
        </Link>
      </div>
      {isLoading && <p className="mt-4 text-sm">Loading…</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data ?? []).map((a: any) => (
          <Link
            key={a.id}
            to={`/apis/${a.id}`}
            className="rounded-xl border bg-white p-4 hover:shadow"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{a.name}</h2>
              <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                {a._count?.operations ?? 0} ops
              </span>
            </div>
            {a.baseUrl && <p className="mt-1 font-mono text-xs text-slate-500">{a.baseUrl}</p>}
            {a.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.description}</p>}
            <p className="mt-2 text-xs text-slate-400">
              {(a.mappings ?? []).length > 0
                ? `Accepted: ${(a.mappings ?? []).map((m: any) => m.serviceDomain.name).join(', ')}`
                : 'Not yet mapped'}
              {a.owner ? ` · ${a.owner}` : ''}
            </p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
