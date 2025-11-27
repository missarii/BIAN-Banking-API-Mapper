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
