import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export function DomainDetailPage() {
  const { id } = useParams();
  const { data: d, isLoading } = useQuery({
    queryKey: ['domain', id],
    queryFn: () => api.get(`/service-domains/${id}`),
  });

  return (
    <Layout>
      {isLoading && <p className="text-sm">Loading…</p>}
      {d && (
        <>
          <Link to="/service-domains" className="text-xs text-blue-700 hover:underline">
            ← Back to catalog
          </Link>
          <h1 className="mt-1 text-xl font-bold">{d.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {d.businessArea} · BIAN {d.bianVersion}
            {d.controlRecord ? ` · Control record: ${d.controlRecord}` : ''}
          </p>
          <p className="mt-3 max-w-3xl text-sm">{d.description}</p>

          {d.behaviorQualifiers?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {d.behaviorQualifiers.map((bq: string) => (
                <span key={bq} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {bq}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h2 className="text-sm font-semibold">
                Service operations ({d.bianOperations?.operations?.length ?? 0})
              </h2>
              <ul className="mt-2 max-h-72 space-y-1 overflow-auto text-xs">
                {(d.bianOperations?.operations ?? []).map((o: any, i: number) => (
                  <li key={i} className="rounded bg-slate-50 px-2 py-1">
                    <span className="font-mono font-semibold">{o.method}</span>{' '}
                    <span className="font-mono">{o.path}</span>
                    {o.summary && <span className="text-slate-500"> — {o.summary}</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-4">
                <h2 className="text-sm font-semibold">Dependencies (demo curation)</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {(d.outgoing ?? []).map((x: any) => (
                    <li key={x.id}>
                      <Link
                        className="text-blue-700 hover:underline"
                        to={`/service-domains/${x.target.slug}`}
                      >
                        {x.target.name}
                      </Link>
                    </li>
                  ))}
                  {(d.outgoing ?? []).length === 0 && (
                    <li className="text-slate-400">No outgoing edges in the demo graph.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <h2 className="text-sm font-semibold">Mapped internal APIs</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {(d.mappings ?? []).map((m: any) => (
                    <li key={m.id}>
                      <Link className="text-blue-700 hover:underline" to={`/apis/${m.api.id}`}>
                        {m.api.name}
                      </Link>
                      <span className="text-slate-400"> · {m.score}%</span>
                    </li>
                  ))}
                  {(d.mappings ?? []).length === 0 && (
                    <li className="text-slate-400">Nothing mapped here yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
