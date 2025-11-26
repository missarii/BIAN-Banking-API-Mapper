import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

const link =
  'px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100';
const active = 'px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white';

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = localStorage.getItem('bian_user');
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-4 text-sm font-bold text-slate-900">
            BIAN API Mapper <span className="font-normal text-slate-400">· POC</span>
          </Link>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={({ isActive }) => (isActive ? active : link)}>
              Dashboard
            </NavLink>
            <NavLink to="/service-domains" className={({ isActive }) => (isActive ? active : link)}>
              Service Domains
            </NavLink>
            <NavLink to="/apis" className={({ isActive }) => (isActive ? active : link)}>
              APIs
            </NavLink>
            <NavLink to="/mapping" className={({ isActive }) => (isActive ? active : link)}>
              Mapping
            </NavLink>
            <NavLink to="/architecture" className={({ isActive }) => (isActive ? active : link)}>
              Architecture
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            {user ? (
              <>
                <span>{JSON.parse(user).email}</span>
                <button
                  className="rounded border px-2 py-1"
                  onClick={() => {
                    localStorage.removeItem('bian_token');
                    localStorage.removeItem('bian_user');
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded border px-2 py-1">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-400">
        Independent proof-of-concept using BIAN 14.0.0 Service Domain names. Scores are this
        tool&rsquo;s analytical alignment metrics, not BIAN certification.
      </footer>
    </div>
  );
}
