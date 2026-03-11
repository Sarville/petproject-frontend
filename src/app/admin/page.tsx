'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TopBar from '@/components/TopBar';
import { DEFAULT_AVATAR } from '@/lib/nicknames';
import type { RequestLog, PaginatedRequestLogs } from '@/types/wish';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  balance: number;
  nickname: string | null;
  avatar: string | null;
  createdAt: string;
}

interface AdminTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
  createdAt: string;
  user: { id: string; email: string; nickname: string | null; avatar: string | null };
}

interface Stats { users: number; wishes: number; transactions: number }

interface SchedulerConfig {
  enabled: boolean;
  intervalType: 'DAILY' | 'MINUTES';
  intervalMinutes: number;
  dailyHour: number;
  dailyMinute: number;
}

interface SchedulerRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  checkedCount: number;
  updatedCount: number;
  errors: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

type Tab = 'dashboard' | 'logs' | 'users' | 'transactions';
type TxTab = 'list' | 'scheduler';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<AdminTransaction['status'], string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  SUCCEEDED: 'bg-green-500/20 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  REFUNDED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STATUS_LABELS: Record<AdminTransaction['status'], string> = {
  PENDING: 'Pending', SUCCEEDED: 'Succeeded', FAILED: 'Failed',
  CANCELED: 'Canceled', REFUNDED: 'Refunded',
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  POST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PATCH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PUT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function methodColor(m: string) { return METHOD_COLORS[m] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/users/stats').then(r => r.ok ? r.json() : null).then(d => d && setStats(d));
  }, []);

  const cards = [
    { label: 'Total Users', value: stats?.users ?? '—', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { label: 'Total Wishes', value: stats?.wishes ?? '—', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )},
    { label: 'Total Transactions', value: stats?.transactions ?? '—', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ];

  return (
    <div className="p-6">
      <h2 className="text-white text-xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#0f2239] border border-slate-700 rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-blue-400 shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">{card.label}</p>
              <p className="text-white text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsView() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sortDir, ...(search ? { search } : {}), ...(method ? { method } : {}) });
      const res = await fetch(`/api/request-logs?${params}`);
      if (!res.ok) return;
      const json: PaginatedRequestLogs = await res.json();
      setLogs(json.data); setTotal(json.total); setTotalPages(json.totalPages);
    } finally { setLoading(false); }
  }, [page, search, method, sortDir]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">Request Logs</h2>
        <span className="text-slate-400 text-sm">{total} records</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by URL..."
            className="w-full bg-[#1e3a5f] text-white text-sm rounded-lg pl-9 pr-3 py-2 border border-transparent focus:border-blue-500 focus:outline-none placeholder:text-slate-500"
          />
        </div>
        <button onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-[#1e3a5f] text-slate-400 hover:text-white border border-transparent hover:border-slate-600 transition-colors text-sm shrink-0">
          {sortDir === 'desc' ? '↓ New' : '↑ Old'}
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {['', ...HTTP_METHODS].map(m => (
          <button key={m} onClick={() => { setMethod(m); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${method === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-slate-200'}`}>
            {m || 'All'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <p className="text-slate-500 text-sm text-center py-10">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">No records found.</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="bg-[#0f2239] border border-slate-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${methodColor(log.method)}`}>{log.method}</span>
                <span className="text-xs text-slate-400 truncate">{log.user?.email ?? 'anonymous'}</span>
              </div>
              <p className="text-white text-sm font-mono truncate">{log.url}</p>
              <p className="text-slate-500 text-xs mt-0.5">{formatDate(log.createdAt)}</p>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-700 pt-3 shrink-0">
          <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← Prev
          </button>
          <span className="text-slate-400 text-xs">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function UsersView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeRole = async (id: string, role: 'USER' | 'ADMIN') => {
    setUpdating(id);
    try {
      await fetch(`/api/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
      setUsers(u => u.map(user => user.id === id ? { ...user, role } : user));
    } finally { setUpdating(null); }
  };

  return (
    <div className="p-6">
      <h2 className="text-white text-xl font-bold mb-6">Users <span className="text-slate-400 text-base font-normal ml-2">{users.length} total</span></h2>
      {loading ? (
        <p className="text-slate-400 text-sm text-center py-10">Loading...</p>
      ) : (
        <div className="bg-[#0f2239] border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Balance</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-b border-slate-700/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-[#1e3a5f] shrink-0">
                        <Image src={u.avatar ?? DEFAULT_AVATAR} alt="" width={32} height={32} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{u.nickname ?? '—'}</p>
                        <p className="text-slate-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white text-sm">${Number(u.balance).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={updating === u.id}
                      onChange={e => changeRole(u.id, e.target.value as 'USER' | 'ADMIN')}
                      className="bg-[#1e3a5f] text-slate-300 text-xs border border-slate-600 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const RUN_STATUS_BADGE: Record<SchedulerRun['status'], string> = {
  SUCCESS: 'bg-green-500/20 text-green-400 border-green-500/30',
  PARTIAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function SchedulerView() {
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [form, setForm] = useState<SchedulerConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ checkedCount: number; updatedCount: number; errors: string[] } | null>(null);
  const [logs, setLogs] = useState<SchedulerRun[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(true);
  const logsLimit = 20;

  const fetchConfig = useCallback(async () => {
    const res = await fetch('/api/scheduler/config');
    if (!res.ok) return;
    const data: SchedulerConfig = await res.json();
    setConfig(data);
    setForm(data);
  }, []);

  const fetchLogs = useCallback(async (p: number) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/scheduler/logs?page=${p}&limit=${logsLimit}`);
      if (!res.ok) return;
      const json = await res.json();
      setLogs(json.data); setLogsTotal(json.total);
    } finally { setLogsLoading(false); }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const saveConfig = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch('/api/scheduler/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setConfig(await res.json());
    } finally { setSaving(false); }
  };

  const runNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/scheduler/run', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setRunResult(result);
        fetchLogs(1);
        setLogsPage(1);
      }
    } finally { setRunning(false); }
  };

  const logsTotalPages = Math.ceil(logsTotal / logsLimit);

  if (!form) return <p className="text-slate-400 text-sm text-center py-10">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Settings */}
      <div className="bg-[#0f2239] border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-base">Settings</h3>
          {/* Enable/disable toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-slate-400 text-sm">Enabled</span>
            <button
              type="button"
              onClick={() => setForm(f => f ? { ...f, enabled: !f.enabled } : f)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.enabled ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
        </div>

        <div className="space-y-4">
          {/* Interval type */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Interval</p>
            <div className="flex gap-2">
              {(['DAILY', 'MINUTES'] as const).map(type => (
                <button key={type} type="button"
                  onClick={() => setForm(f => f ? { ...f, intervalType: type } : f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.intervalType === type ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200'}`}
                >
                  {type === 'DAILY' ? 'Daily' : 'Every N minutes'}
                </button>
              ))}
            </div>
          </div>

          {/* DAILY time picker */}
          {form.intervalType === 'DAILY' && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Time (UTC)</p>
              <div className="flex items-center gap-2">
                <select
                  value={form.dailyHour}
                  onChange={e => setForm(f => f ? { ...f, dailyHour: Number(e.target.value) } : f)}
                  className="bg-[#1e3a5f] text-white text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-slate-400">:</span>
                <select
                  value={form.dailyMinute}
                  onChange={e => setForm(f => f ? { ...f, dailyMinute: Number(e.target.value) } : f)}
                  className="bg-[#1e3a5f] text-white text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* MINUTES interval */}
          {form.intervalType === 'MINUTES' && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Every (minutes)</p>
              <input
                type="number"
                min={1}
                max={1440}
                value={form.intervalMinutes}
                onChange={e => setForm(f => f ? { ...f, intervalMinutes: Number(e.target.value) } : f)}
                className="bg-[#1e3a5f] text-white text-sm border border-slate-600 rounded-lg px-3 py-1.5 w-28 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-700">
          <button onClick={saveConfig} disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save settings'}
          </button>
          <button onClick={runNow} disabled={running}
            className="px-4 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#253f6a] border border-slate-600 hover:border-slate-500 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2">
            {running ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running...
              </>
            ) : 'Run now'}
          </button>
          {config && (
            <span className="text-slate-500 text-xs ml-auto">
              {config.enabled
                ? config.intervalType === 'DAILY'
                  ? `Runs daily at ${String(config.dailyHour).padStart(2, '0')}:${String(config.dailyMinute).padStart(2, '0')} UTC`
                  : `Runs every ${config.intervalMinutes} min`
                : 'Scheduler disabled'}
            </span>
          )}
        </div>

        {/* Run result */}
        {runResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm border ${runResult.errors.length === 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
            Checked: {runResult.checkedCount} &nbsp;·&nbsp; Updated: {runResult.updatedCount}
            {runResult.errors.length > 0 && <span> &nbsp;·&nbsp; Errors: {runResult.errors.length}</span>}
          </div>
        )}
      </div>

      {/* Run logs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-base">Run Logs</h3>
          <span className="text-slate-400 text-sm">{logsTotal} runs</span>
        </div>
        {logsLoading ? (
          <p className="text-slate-400 text-sm text-center py-10">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">No runs yet.</p>
        ) : (
          <>
            <div className="bg-[#0f2239] border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Started</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Duration</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Checked</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Updated</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((run, i) => (
                    <tr key={run.id} className={`border-b border-slate-700/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3 text-slate-300 text-xs">{formatDate(run.startedAt)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDuration(run.startedAt, run.finishedAt)}</td>
                      <td className="px-4 py-3 text-white text-sm">{run.checkedCount}</td>
                      <td className="px-4 py-3 text-white text-sm">{run.updatedCount}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${RUN_STATUS_BADGE[run.status]}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{run.errors.length > 0 ? run.errors.length : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logsTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button onClick={() => { const p = logsPage - 1; setLogsPage(p); fetchLogs(p); }} disabled={logsPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>
                <span className="text-slate-400 text-xs">{logsPage} / {logsTotalPages}</span>
                <button onClick={() => { const p = logsPage + 1; setLogsPage(p); fetchLogs(p); }} disabled={logsPage >= logsTotalPages}
                  className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TransactionsView() {
  const [txTab, setTxTab] = useState<TxTab>('list');
  const [data, setData] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchTx = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/all-transactions?page=${p}&limit=${limit}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data); setTotal(json.total);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTx(1); }, [fetchTx]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* Sub-tab header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-bold">
          {txTab === 'list' ? <>Transactions <span className="text-slate-400 text-base font-normal ml-2">{total} total</span></> : 'Scheduler'}
        </h2>
        <div className="flex gap-1 bg-[#0f2239] border border-slate-700 rounded-lg p-1">
          <button onClick={() => setTxTab('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${txTab === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            Transactions
          </button>
          <button onClick={() => setTxTab('scheduler')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${txTab === 'scheduler' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            Scheduler
          </button>
        </div>
      </div>

      {txTab === 'scheduler' && <SchedulerView />}

      {txTab === 'list' && (
        loading ? (
          <p className="text-slate-400 text-sm text-center py-10">Loading...</p>
        ) : (
          <>
            <div className="bg-[#0f2239] border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((tx, i) => (
                    <tr key={tx.id} className={`border-b border-slate-700/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-600 bg-[#1e3a5f] shrink-0">
                            <Image src={tx.user.avatar ?? DEFAULT_AVATAR} alt="" width={24} height={24} className="object-cover w-full h-full" />
                          </div>
                          <div>
                            <p className="text-white text-sm">{tx.user.nickname ?? tx.user.email}</p>
                            {tx.user.nickname && <p className="text-slate-500 text-xs">{tx.user.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[tx.status]}`}>
                          {STATUS_LABELS[tx.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-sm font-medium">${Number(tx.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button onClick={() => { const p = page - 1; setPage(p); fetchTx(p); }} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>
                <span className="text-slate-400 text-xs">{page} / {totalPages}</span>
                <button onClick={() => { const p = page + 1; setPage(p); fetchTx(p); }} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

// ─── Admin Sidebar ────────────────────────────────────────────────────────────

const adminNavItems: { label: string; tab: Tab; icon: React.ReactNode }[] = [
  {
    label: 'Dashboard', tab: 'dashboard',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    label: 'Logs', tab: 'logs',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    label: 'Users', tab: 'users',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    label: 'Transactions', tab: 'transactions',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const TAB_TITLES: Record<Tab, string> = {
    dashboard: 'Dashboard',
    logs: 'Request Logs',
    users: 'Users',
    transactions: 'Transactions',
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-60 h-screen bg-[#0f2239] border-r border-slate-700 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-700 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-terminal-wave-compact.svg" alt="PetProject" width={140} height={32} />
          <p className="text-xs text-blue-400 font-semibold mt-1.5 tracking-wider uppercase">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNavItems.map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={TAB_TITLES[activeTab]} />
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'logs' && <LogsView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'transactions' && <TransactionsView />}
        </main>
      </div>
    </div>
  );
}
