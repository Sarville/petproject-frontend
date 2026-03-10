'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';
import AdminPanel from '@/components/AdminPanel';
import UserDashboard from '@/components/UserDashboard';
import ArtSearch from '@/components/ArtSearch';
import MemeSearch from '@/components/MemeSearch';
import WishList from '@/components/WishList';
import LogPanel from '@/components/LogPanel';

interface Quotas {
  artsearch: number | null;
  humorapi: number | null;
}

function MainView() {
  const [logsOpen, setLogsOpen] = useState(false);
  const [quotas, setQuotas] = useState<Quotas>({ artsearch: null, humorapi: null });

  const fetchQuotas = useCallback(async () => {
    try {
      const res = await fetch('/api/quotas');
      if (!res.ok) return;
      const data = await res.json();
      setQuotas({ artsearch: data.artsearch ?? null, humorapi: data.humorapi ?? null });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchQuotas(); }, [fetchQuotas]);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col min-h-full">
          <ArtSearch quota={quotas.artsearch} onQuotaUsed={fetchQuotas} />
          <MemeSearch quota={quotas.humorapi} onQuotaUsed={fetchQuotas} />
          <div className="flex-1 flex flex-col min-h-[400px]">
            <WishList />
          </div>
          <div className="mt-4 shrink-0">
            <button
              onClick={() => setLogsOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Logs
            </button>
          </div>
        </div>
      </div>
      <LogPanel open={logsOpen} onClose={() => setLogsOpen(false)} />
    </>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const [adminView, setAdminView] = useState(false);
  const [dashboardView, setDashboardView] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dashboard') === '1') setDashboardView(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleAdminClick = () => {
    setAdminView((v) => !v);
    setDashboardView(false);
  };

  const handleDashboardClick = () => {
    setDashboardView((v) => !v);
    setAdminView(false);
  };

  let content: React.ReactNode;
  if (dashboardView) {
    content = <UserDashboard />;
  } else if (adminView && user.role === 'ADMIN') {
    content = <AdminPanel />;
  } else {
    content = <MainView />;
  }

  return (
    <div className="h-screen flex flex-col">
      <NavBar
        onAdminClick={handleAdminClick}
        isAdminView={adminView}
        onDashboardClick={handleDashboardClick}
        isDashboardView={dashboardView}
      />
      {content}
    </div>
  );
}
