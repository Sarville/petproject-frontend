'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PaymentModal from './PaymentModal';

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
  PENDING: 'Pending',
  SUCCEEDED: 'Paid',
  FAILED: 'Failed',
  CANCELED: 'Canceled',
  REFUNDED: 'Refunded',
};

const STATUS_COLORS: Record<Transaction['status'], string> = {
  PENDING: 'text-yellow-400',
  SUCCEEDED: 'text-green-400',
  FAILED: 'text-red-400',
  CANCELED: 'text-slate-400',
  REFUNDED: 'text-blue-400',
};

export default function UserDashboard() {
  const { user, refetch } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingTx, setLoadingTx] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

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

  const fetchTransactions = useCallback(async (p: number) => {
    setLoadingTx(true);
    try {
      const res = await fetch(`/api/users/me/transactions?page=${p}&limit=10`);
      if (!res.ok) return;
      const data: TransactionsResponse = await res.json();
      setTransactions(data.data);
      setTotal(data.total);
    } catch {
      // ignore
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchTransactions(1);
  }, [fetchBalance, fetchTransactions]);

  const handlePaymentSuccess = useCallback(async () => {
    setPaymentOpen(false);
    await fetchBalance();
    await fetchTransactions(1);
    await refetch();
  }, [fetchBalance, fetchTransactions, refetch]);

  const totalPages = Math.ceil(total / 10);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTransactions(p);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Balance card */}
        <div className="bg-[#0f2239] border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Your balance</p>
          <p className="text-3xl font-bold text-white mb-4">
            {balance === null ? '...' : `$${Number(balance).toFixed(2)}`}
          </p>
          <button
            onClick={() => setPaymentOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Top up — $100
          </button>
        </div>

        {/* Transactions */}
        <div className="bg-[#0f2239] border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Transaction history</h3>

          {loadingTx && (
            <p className="text-slate-400 text-sm text-center py-4">Loading...</p>
          )}

          {!loadingTx && transactions.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No transactions yet</p>
          )}

          {!loadingTx && transactions.length > 0 && (
            <div className="flex flex-col gap-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-medium ${STATUS_COLORS[tx.status]}`}>
                      {STATUS_LABELS[tx.status]}
                    </span>
                    {tx.failureReason && (
                      <span className="text-xs text-red-400/80 truncate max-w-[220px]">
                        {tx.failureReason}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-white font-semibold shrink-0 ml-4">
                    ${Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="bg-[#0f2239] border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Account</p>
          <p className="text-white text-sm">{user?.email}</p>
          <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
            {user?.role}
          </span>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
        hasSavedCard={hasSavedCard}
      />
    </div>
  );
}
