interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-4 py-2 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <span className="text-slate-400 text-sm px-4">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-4 py-2 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
