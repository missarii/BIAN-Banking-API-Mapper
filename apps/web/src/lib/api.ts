const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

async function req(path: string, init?: RequestInit) {
  const token = localStorage.getItem('bian_token');
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ''}`);
  }
  return res.json();
}

export const api = {
  get: (path: string) => req(path),
  post: (path: string, body: unknown) =>
    req(path, { method: 'POST', body: JSON.stringify(body) }),
  del: (path: string) => req(path, { method: 'DELETE' }),
  upload: async (path: string, file: File) => {
    const token = localStorage.getItem('bian_token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },
};

export function confidenceColor(c?: string) {
  if (c === 'HIGH') return 'bg-emerald-100 text-emerald-800';
  if (c === 'MEDIUM') return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}
