import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export function ArchitecturePage() {
  const [area, setArea] = useState('');
  const { data } = useQuery({
    queryKey: ['graph', area],
    queryFn: () => api.get(`/architecture/graph${area ? `?area=${encodeURIComponent(area)}` : ''}`),
  });

  const { nodes, edges } = useMemo(() => {
    const g = data ?? { nodes: [], edges: [] };
    const domains = g.nodes.filter((n: any) => n.type === 'domain');
    const apis = g.nodes.filter((n: any) => n.type === 'api');
    const col = (i: number) => (i % 4) * 260;
    const row = (i: number) => Math.floor(i / 4) * 130;
    return {
      nodes: [
        ...domains.map((n: any, i: number) => ({
          id: n.id,
          position: { x: col(i), y: 260 + row(i) },
          data: { label: `${n.label} (${n.area ?? ''})` },
          style: {
            border: '1px solid #0e5aa8',
            borderRadius: 10,
            padding: 8,
            background: '#eaf3fd',
            fontSize: 12,
            width: 230,
          },
        })),
        ...apis.map((n: any, i: number) => ({
          id: n.id,
          position: { x: col(i), y: row(i) },
          data: { label: `API: ${n.label}` },
          style: {
            border: '1px solid #475569',
            borderRadius: 10,
            padding: 8,
            background: '#f1f5f9',
            fontSize: 12,
            width: 230,
          },
        })),
      ],
      edges: (g.edges ?? []).map((e: any, i: number) => ({
        id: `e${i}`,
        source: e.source,
        target: e.target,
        label: e.kind === 'maps-to' ? 'maps to' : 'depends on',
        animated: e.kind === 'maps-to',
        style: { stroke: e.kind === 'maps-to' ? '#0e5aa8' : '#94a3b8' },
      })),
    };
  }, [data]);

  return (
    <Layout>
      <h1 className="text-xl font-bold">Architecture Graph</h1>
      <p className="mt-1 text-sm text-slate-500">
        Blue/grey boxes are BIAN Service Domains, grey boxes are your APIs. Edges show accepted
        mappings and curated domain dependencies.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          className="rounded-lg border px-3 py-2 text-sm"
          placeholder="Filter by business area (e.g. Payments)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
      </div>
      <div className="mt-4 h-[560px] rounded-xl border bg-white">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </Layout>
  );
}
