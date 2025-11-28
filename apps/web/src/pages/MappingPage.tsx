import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, confidenceColor } from '../lib/api';
import { Layout } from '../components/Layout';

export function MappingPage() {
  const qc = useQueryClient();
  const [apiId, setApiId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const { data: apis } = useQuery({ queryKey: ['apis-all'], queryFn: () => api.get('/apis') });
  const { data: domains } = useQuery({
    queryKey: ['domains-all'],
    queryFn: () => api.get('/service-domains'),
  });

  const analyze = useMutation({
    mutationFn: () => api.post('/mappings/analyze', { apiId, topN: 5 }),
    onSuccess: (r) => {
      setResult(r);
      setMsg('');
      qc.invalidateQueries({ queryKey: ['api', apiId] });
    },
    onError: (e: any) => setMsg(`Analysis failed: ${e.message}`),
  });

  const review = useMutation({
    mutationFn: (body: any) => api.post('/mappings/review', { apiId, ...body }),
    onSuccess: () => setMsg('Review saved. The architecture graph and dashboard update from accepted mappings.'),
    onError: (e: any) => setMsg(`Review failed: ${e.message} (login as architect first)`),
  });

  return (
    <Layout>
      <h1 className="text-xl font-bold">API → BIAN Mapping</h1>
      <p className="mt-1 text-sm text-slate-500">
        Human-in-the-loop: the engine proposes alignment candidates, the architect decides.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          className="min-w-64 flex-1 rounded-lg border px-3 py-2 text-sm"
          value={apiId}
          onChange={(e) => setApiId(e.target.value)}
        >
          <option value="">Select an internal API…</option>
          {(apis ?? []).map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={!apiId || analyze.isPending}
          onClick={() => analyze.mutate()}
