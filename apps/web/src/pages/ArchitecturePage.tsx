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
