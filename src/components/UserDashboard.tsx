'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import PaymentModal from './PaymentModal';
import { AVATARS, DEFAULT_AVATAR, generateRandomNickname } from '@/lib/nicknames';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
  failureReason: string | null;
  createdAt: string;
}

interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_LABELS: Record<Transaction['status'], string> = {
  PENDING: 'Pending', SUCCEEDED: 'Paid', FAILED: 'Failed', CANCELED: 'Canceled', REFUNDED: 'Refunded',
};

const STATUS_COLORS: Record<Transaction['status'], string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  SUCCEEDED: 'bg-green-500/20 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  REFUNDED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

// ─── Transaction History Slide Panel ─────────────────────────────────────────

function TransactionPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/me/transactions?page=${p}&limit=10`);
      if (!res.ok) return;
      const data: TransactionsResponse = await res.json();
      setTransactions(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { setPage(1); fetchTransactions(1); }
  }, [open, fetchTransactions]);

  const totalPages = Math.ceil(total / 10);

  return (
    <>
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-[#0f2239] border-l border-slate-700 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Transaction History</h2>
            <p className="text-slate-400 text-xs mt-0.5">{total} records</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-10">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No transactions yet.</p>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="bg-[#1e3a5f] border border-slate-700/50 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[tx.status]}`}>
                    {STATUS_LABELS[tx.status]}
                  </span>
                  {tx.failureReason && (
                    <p className="text-xs text-red-400/80 mt-0.5 truncate max-w-[220px]">{tx.failureReason}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(tx.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-white font-semibold shrink-0">${Number(tx.amount).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 shrink-0">
            <button onClick={() => { const p = page - 1; setPage(p); fetchTransactions(p); }} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ← Prev
            </button>
            <span className="text-slate-400 text-xs">{page} / {totalPages}</span>
            <button onClick={() => { const p = page + 1; setPage(p); fetchTransactions(p); }} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>
      {open && <div className="fixed inset-0 z-30" onClick={onClose} />}
    </>
  );
}

// ─── Avatar Picker ────────────────────────────────────────────────────────────

function AvatarPicker({ current, onSelect, onClose }: { current: string; onSelect: (a: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#0f2239] border border-slate-700 rounded-2xl p-6 w-full max-w-sm z-10">
        <h3 className="text-white font-bold mb-4">Choose Avatar</h3>
        <div className="grid grid-cols-4 gap-2">
          {AVATARS.map(av => (
            <button
              key={av}
              onClick={() => { onSelect(av); onClose(); }}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${av === current ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-600 hover:border-slate-400'}`}
            >
              <Image src={av} alt="avatar" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { user, refetch } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Nickname editing
  const [editNick, setEditNick] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? DEFAULT_AVATAR);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setNickname(user?.nickname ?? '');
    setAvatar(user?.avatar ?? DEFAULT_AVATAR);
  }, [user]);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me/balance');
      if (!res.ok) return;
      const data = await res.json();
      setBalance(Number(data.balance));
      setHasSavedCard(!!data.hasSavedCard);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handlePaymentSuccess = useCallback(async () => {
    setPaymentOpen(false);
    await fetchBalance();
    await refetch();
  }, [fetchBalance, refetch]);

  const generateNick = useCallback(async () => {
    setGenerating(true);
    setProfileError('');
    try {
      const res = await fetch('/api/users/me/nickname/generate');
      if (res.ok) {
        const data = await res.json();
        setNickname(data.nickname);
      } else {
        setNickname(generateRandomNickname());
      }
    } catch {
      setNickname(generateRandomNickname());
    } finally {
      setGenerating(false);
    }
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setProfileError('');
    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname || undefined, avatar }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setProfileError(body.message ?? 'Failed to save');
        return;
      }
      await refetch();
      setEditNick(false);
    } catch {
      setProfileError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (av: string) => {
    setAvatar(av);
    await fetch('/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: av }),
    });
    await refetch();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-5">
      {/* Profile block */}
      <div className="bg-[#0f2239] border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-bold text-base mb-5">Profile</h3>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <button
            onClick={() => setAvatarPickerOpen(true)}
            className="group relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600 hover:border-blue-500 transition-colors shrink-0"
          >
            <Image src={avatar} alt="avatar" fill sizes="64px" className="object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editNick ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#1e3a5f] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-medium">
                    {nickname || <span className="text-slate-500">Generate a nickname</span>}
                  </div>
                  <button onClick={generateNick} disabled={generating}
                    className="px-3 py-2 bg-[#1e3a5f] hover:bg-[#234876] text-slate-300 hover:text-white text-sm border border-slate-600 hover:border-slate-400 rounded-lg transition-colors disabled:opacity-50">
                    {generating ? '...' : 'Generate'}
                  </button>
                </div>
                {profileError && <p className="text-red-400 text-xs">{profileError}</p>}
                <div className="flex gap-2">
                  <button onClick={saveProfile} disabled={saving || !nickname}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditNick(false); setNickname(user?.nickname ?? ''); setProfileError(''); }}
                    className="px-3 py-1.5 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-xs rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-lg">{user?.nickname ?? '—'}</p>
                <button onClick={() => setEditNick(true)}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Balance block */}
      <div className="bg-[#0f2239] border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-bold text-base mb-5">Balance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Available</p>
            <p className="text-3xl font-bold text-white">
              {balance === null ? '...' : `$${Number(balance).toFixed(2)}`}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPaymentOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Top up — $100
            </button>
            <button
              onClick={() => setTxOpen(true)}
              className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Transaction History
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
        hasSavedCard={hasSavedCard}
      />
      <TransactionPanel open={txOpen} onClose={() => setTxOpen(false)} />
      {avatarPickerOpen && (
        <AvatarPicker
          current={avatar}
          onSelect={handleAvatarSelect}
          onClose={() => setAvatarPickerOpen(false)}
        />
      )}
    </div>
  );
}
