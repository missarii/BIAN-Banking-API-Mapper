import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export function DomainsPage() {
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/service-domains/areas'),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['domains', search, area],
    queryFn: () =>
      api.get(
        `/service-domains?search=${encodeURIComponent(search)}${area ? `&area=${encodeURIComponent(area)}` : ''}`,
      ),
  });

  return (
    <Layout>
      <h1 className="text-xl font-bold">Service Domain Catalog</h1>
      <p className="mt-1 text-sm text-slate-500">
        BIAN 14.0.0 Service Domain names and purposes · {data?.length ?? '…'} domains
      </p>
      <div className="mt-4 flex gap-2">
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Search Service Domains — try “payment”…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">All areas</option>
          {(areas ?? []).map((a: any) => (
            <option key={a.businessArea} value={a.businessArea}>
              {a.businessArea} ({a._count.businessArea})
            </option>
          ))}
        </select>
      </div>
      {isLoading && <p className="mt-4 text-sm">Loading…</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data ?? []).map((d: any) => (
          <Link
            key={d.id}
            to={`/service-domains/${d.slug}`}
            className="rounded-xl border bg-white p-4 hover:shadow"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{d.name}</h2>
              <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {d.businessArea}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{d.description}</p>
            <p className="mt-2 text-xs text-slate-400">
              {d._count?.mappings ?? 0} accepted mapping{(d._count?.mappings ?? 0) === 1 ? '' : 's'}
            </p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
