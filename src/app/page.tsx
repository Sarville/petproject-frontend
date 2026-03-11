'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import UserDashboard from '@/components/UserDashboard';
import ArtSearch from '@/components/ArtSearch';
import MemeSearch from '@/components/MemeSearch';
import WishList from '@/components/WishList';

interface Quotas {
  artsearch: number | null;
  humorapi: number | null;
}

function WishesView() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col min-h-full">
      <div className="flex-1 flex flex-col min-h-[400px]">
        <WishList />
      </div>
    </div>
  );
}

function ApisView() {
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
    <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col gap-6">
      <ArtSearch quota={quotas.artsearch} onQuotaUsed={fetchQuotas} />
      <MemeSearch quota={quotas.humorapi} onQuotaUsed={fetchQuotas} />
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  '': 'Wishes',
  'apis': 'External APIs',
  'account': 'Account',
};

function HomePageInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const menu = searchParams.get('menu') ?? '';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && user && user.nickname == null) {
      router.replace('/onboarding');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  let content: React.ReactNode;
  if (menu === 'account') {
    content = <UserDashboard />;
  } else if (menu === 'apis') {
    content = <ApisView />;
  } else {
    content = <WishesView />;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={PAGE_TITLES[menu] ?? 'App'} />
        <main className="flex-1 overflow-y-auto">
          {content}
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    }>
      <HomePageInner />
    </Suspense>
  );
}
