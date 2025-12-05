import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api, confidenceColor } from '../lib/api';
import { Layout } from '../components/Layout';

export function ApiDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const { data: a, isLoading } = useQuery({
    queryKey: ['api', id],
    queryFn: () => api.get(`/apis/${id}`),
  });

  const analyze = useMutation({
    mutationFn: () => api.post('/mappings/analyze', { apiId: id, topN: 5 }),
    onSuccess: () => {
      setMsg('Analysis complete — candidates saved below.');
      qc.invalidateQueries({ queryKey: ['api', id] });
    },
    onError: (e: any) => setMsg(`Analysis failed: ${e.message}`),
  });

  const review = useMutation({
    mutationFn: (body: any) => api.post('/mappings/review', { apiId: id, ...body }),
    onSuccess: () => {
      setMsg('Review saved.');
      qc.invalidateQueries({ queryKey: ['api', id] });
    },
    onError: (e: any) => setMsg(`Review failed: ${e.message} (login as architect first)`),
  });

  return (
    <Layout>
      {isLoading && <p className="text-sm">Loading…</p>}
      {a && (
        <>
          <Link to="/apis" className="text-xs text-blue-700 hover:underline">← Back to registry</Link>
          <h1 className="mt-1 text-xl font-bold">{a.name}</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {[a.baseUrl, a.version ? `v${a.version}` : '', a.owner].filter(Boolean).join(' · ')}
          </p>
          {a.description && <p className="mt-3 max-w-3xl text-sm">{a.description}</p>}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h2 className="text-sm font-semibold">Operations ({(a.operations ?? []).length})</h2>
              <ul className="mt-2 max-h-72 space-y-1 overflow-auto text-xs">
                {(a.operations ?? []).map((o: any) => (
                  <li key={o.id} className="rounded bg-slate-50 px-2 py-1">
                    <span className="font-mono font-semibold">{o.method}</span>{' '}
                    <span className="font-mono">{o.path}</span>
                    {o.summary && <span className="text-slate-500"> — {o.summary}</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">BIAN mappings</h2>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  disabled={analyze.isPending}
                  onClick={() => analyze.mutate()}
                >
                  {analyze.isPending ? 'Analyzing…' : 'Analyze mapping'}
                </button>
              </div>
              {msg && <p className="mt-2 text-xs text-slate-500">{msg}</p>}
              <ul className="mt-3 space-y-2">
                {(a.mappings ?? []).map((m: any) => (
                  <li key={m.id} className="rounded-lg border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Link className="font-medium text-blue-700 hover:underline" to={`/service-domains/${m.serviceDomain.slug}`}>
                        {m.serviceDomain.name}
                      </Link>
                      <span className={`rounded px-2 py-0.5 text-xs ${confidenceColor(m.confidence)}`}>
                        {m.score}% · {m.confidence}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Status: <span className="font-medium">{m.status}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => review.mutate({ serviceDomainId: m.serviceDomainId, decision: 'ACCEPT' })}
                      >
                        Accept
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => review.mutate({ serviceDomainId: m.serviceDomainId, decision: 'REJECT' })}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
                {(a.mappings ?? []).length === 0 && (
                  <li className="text-xs text-slate-400">No candidates yet — run Analyze mapping.</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
