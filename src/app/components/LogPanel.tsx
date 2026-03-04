"use client";

import { useState, useEffect, useCallback } from "react";
import type { RequestLog, PaginatedRequestLogs } from "@/types/wish";
import { basePath } from "@/lib/config";

interface Props {
  open: boolean;
  onClose: () => void;
}

const HTTP_METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  POST: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PATCH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PUT: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

function methodColor(method: string): string {
  return METHOD_COLORS[method] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search ? u.search : "");
  } catch {
    return url;
  }
}

export default function LogPanel({ open, onClose }: Props) {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        sortDir,
        ...(search ? { search } : {}),
        ...(method ? { method } : {}),
      });
      const res = await fetch(`${basePath}/api/request-logs?${params}`);
      const json: PaginatedRequestLogs = await res.json();
      setLogs(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, method, sortDir]);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleMethod = (v: string) => {
    setMethod(v);
    setPage(1);
  };

  const toggleSort = () => {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  return (
    <>
      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-[#0f2239] border-l border-slate-700 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Request Log</h2>
            <p className="text-slate-400 text-xs mt-0.5">{total} records</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search + Sort */}
        <div className="px-4 pt-4 shrink-0 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by URL..."
                className="w-full bg-[#1e3a5f] text-white text-sm rounded-lg pl-9 pr-3 py-2 border border-transparent focus:border-blue-500 focus:outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              onClick={toggleSort}
              title={sortDir === "desc" ? "Newest first" : "Oldest first"}
              className="px-3 py-2 rounded-lg bg-[#1e3a5f] text-slate-400 hover:text-white border border-transparent hover:border-slate-600 transition-colors text-sm shrink-0"
            >
              {sortDir === "desc" ? "↓ New" : "↑ Old"}
            </button>
          </div>

          {/* Method filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => handleMethod("")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                method === ""
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            {HTTP_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => handleMethod(m)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  method === m
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Log list - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 mt-1">
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-10">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No records found.</p>
          ) : (
            logs.map((log) => <LogEntry key={log.id} log={log} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 shrink-0">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-slate-400 text-xs">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={onClose}
        />
      )}
    </>
  );
}

function LogEntry({ log }: { log: RequestLog }) {
  const [expanded, setExpanded] = useState(false);
  const shortUrl = shortenUrl(log.url);

  return (
    <div className="bg-[#1e3a5f] rounded-xl p-3 border border-slate-700/50">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${methodColor(log.method)}`}
            >
              {log.method}
            </span>
            {log.body && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors shrink-0"
              >
                {expanded ? "▲ hide body" : "▼ body"}
              </button>
            )}
          </div>
          <p className="text-white text-sm font-mono truncate" title={shortUrl}>
            {shortUrl}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">{formatDate(log.createdAt)}</p>
          {expanded && log.body && (
            <pre className="mt-2 text-xs text-slate-300 bg-[#0a1628] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-40">
              {log.body}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
