"use client";

import { useState, useEffect, useCallback } from "react";
import type { Wish, PaginatedWishes } from "@/types/wish";
import { basePath } from "@/lib/config";
import WishCard from "./WishCard";
import WishModal from "./WishModal";
import Pagination from "./Pagination";
import SearchBar from "./SearchBar";
import LogPanel from "./LogPanel";

export default function WishList() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  const fetchWishes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "5",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`${basePath}/api/wishes?${params}`);
      const json: PaginatedWishes = await res.json();
      setWishes(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${basePath}/api/wishes/${id}`, { method: "DELETE" });
    fetchWishes();
  };

  const handleEdit = (wish: Wish) => {
    setEditingWish(wish);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingWish(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    fetchWishes();
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0 gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white leading-tight">My Wish List</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              {total} wish{total !== 1 ? "es" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLogsOpen(true)}
              className="text-slate-400 hover:text-slate-200 font-medium px-3 py-2 rounded-lg border border-slate-600 hover:border-slate-400 transition-colors text-sm whitespace-nowrap"
            >
              Logs
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 sm:px-5 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              + Add Wish
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0">
          <SearchBar value={search} onChange={handleSearch} />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 min-h-0">
          {loading ? (
            <div className="text-center text-slate-400 py-20">Loading...</div>
          ) : wishes.length === 0 ? (
            <div className="text-center text-slate-500 py-20">
              {search
                ? "No wishes match your search."
                : "No wishes yet. Add your first one!"}
            </div>
          ) : (
            wishes.map((wish) => (
              <WishCard
                key={wish.id}
                wish={wish}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="shrink-0">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <WishModal
          wish={editingWish}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {/* Log panel */}
      <LogPanel open={logsOpen} onClose={() => setLogsOpen(false)} />
    </>
  );
}
