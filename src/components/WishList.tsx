import { useState, useEffect, useCallback } from "react";
import type { Wish, PaginatedWishes } from "../types/wish";
import WishCard from "./WishCard";
import WishModal from "./WishModal";
import Pagination from "./Pagination";
import SearchBar from "./SearchBar";

export default function WishList() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);

  const fetchWishes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: "5",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/wishes?${params}`);
      const json: PaginatedWishes = await res.json();
      setWishes(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchWishes(); }, [fetchWishes]);

  const handleDelete = async (id: string) => {
    await fetch(`/wishes/${id}`, { method: "DELETE" });
    fetchWishes();
  };

  const handleEdit = (wish: Wish) => { setEditingWish(wish); setModalOpen(true); };
  const handleModalClose = () => { setModalOpen(false); setEditingWish(null); };
  const handleModalSave = () => { handleModalClose(); fetchWishes(); };

  return (
    <>
      <div className="bg-[#1e3a5f] rounded-2xl p-5 flex flex-col flex-1 min-h-[400px]">
        <div className="flex items-center justify-between mb-3 shrink-0 gap-3">
          <div className="min-w-0">
            <h2 className="text-white font-bold text-xl">My Wish List</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {total} wish{total !== 1 ? "es" : ""} total
            </p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0">
            + Add Wish
          </button>
        </div>

        <div className="shrink-0">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 min-h-0">
          {loading ? (
            <div className="text-center text-slate-400 py-20">Loading...</div>
          ) : wishes.length === 0 ? (
            <div className="text-center text-slate-500 py-20">
              {search ? "No wishes match your search." : "No wishes yet. Add your first one!"}
            </div>
          ) : (
            wishes.map((wish) => (
              <WishCard key={wish.id} wish={wish} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="shrink-0">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {modalOpen && (
        <WishModal wish={editingWish} onClose={handleModalClose} onSave={handleModalSave} />
      )}
    </>
  );
}
