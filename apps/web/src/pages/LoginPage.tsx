import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('architect@bank.example');
  const [password, setPassword] = useState('architect123');
  const [error, setError] = useState('');

  return (
    <Layout>
      <h1 className="text-xl font-bold">Login</h1>
      <p className="mt-1 text-sm text-slate-500">
        Demo accounts are seeded: architect@bank.example / admin@bank.example / viewer@bank.example
      </p>
      <form
        className="mt-4 max-w-sm space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          try {
            const r = await api.post('/auth/login', { email, password });
            localStorage.setItem('bian_token', r.accessToken);
            localStorage.setItem('bian_user', JSON.stringify(r.user));
            navigate('/');
          } catch (err: any) {
            setError(err.message);
          }
        }}
      >
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Login
        </button>
      </form>
    </Layout>
  );
}
