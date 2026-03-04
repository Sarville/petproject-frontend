"use client";

import type { Wish } from "@/types/wish";

interface Props {
  wish: Wish;
  onEdit: (wish: Wish) => void;
  onDelete: (id: string) => void;
}

export default function WishCard({ wish, onEdit, onDelete }: Props) {
  const date = new Date(wish.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-[#1e3a5f] rounded-xl p-5 flex items-start justify-between group hover:bg-[#234876] transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <h3 className="text-white font-semibold text-lg truncate">
          {wish.title}
        </h3>
        {wish.description && (
          <p className="text-slate-300 text-sm mt-1 line-clamp-2">
            {wish.description}
          </p>
        )}
        <p className="text-slate-500 text-xs mt-2">{date}</p>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(wish)}
          className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded-md border border-blue-400/40 hover:border-blue-300/60 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(wish.id)}
          className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-md border border-red-400/40 hover:border-red-300/60 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
