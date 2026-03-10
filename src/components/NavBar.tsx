'use client';

import { useAuth } from "../context/AuthContext";

interface Props {
  onAdminClick: () => void;
  isAdminView: boolean;
  onDashboardClick: () => void;
  isDashboardView: boolean;
}

export default function NavBar({ onAdminClick, isAdminView, onDashboardClick, isDashboardView }: Props) {
  const { user, logout } = useAuth();

  return (
    <div className="bg-[#0f2239] border-b border-slate-700 px-4 py-3 shrink-0">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-semibold text-sm truncate">{user?.email}</span>
          {user?.role === "ADMIN" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-600/40 shrink-0">
              ADMIN
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDashboardClick}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              isDashboardView
                ? "bg-blue-600 text-white border-blue-600"
                : "text-slate-300 hover:text-white border-slate-600 hover:border-slate-400"
            }`}
          >
            {isDashboardView ? "← App" : "Account"}
          </button>
          {user?.role === "ADMIN" && (
            <button
              onClick={onAdminClick}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                isAdminView
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-slate-300 hover:text-white border-slate-600 hover:border-slate-400"
              }`}
            >
              {isAdminView ? "← App" : "Admin Panel"}
            </button>
          )}
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
