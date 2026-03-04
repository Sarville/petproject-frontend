import { useState, type FormEvent } from "react";

const PAGE_SIZE = 10;

interface Artwork {
  id: number;
  title: string;
  image: string;
}

interface ArtworkDetail extends Artwork {
  author?: string;
  start_date?: number;
  end_date?: number;
  art_types?: string[];
  materials?: string[];
  description?: string;
}

interface SearchResult {
  available: number;
  artworks: Artwork[];
}

interface Props {
  quota: number | null;
  onQuotaUsed: () => void;
}

async function fetchWithError(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res;
}

export default function ArtSearch({ quota, onQuotaUsed }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ArtworkDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [randomLoading, setRandomLoading] = useState(false);

  const fetchArtworks = async (q: string, off: number): Promise<SearchResult> => {
    const params = new URLSearchParams({ query: q, number: String(PAGE_SIZE), offset: String(off) });
    const res = await fetchWithError(`/artsearch/artworks?${params}`);
    return res.json();
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setOffset(0);
    try {
      const data = await fetchArtworks(query.trim(), 0);
      setResult(data);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setOpen(true);
    } finally {
      setLoading(false);
      onQuotaUsed();
    }
  };

  const handleLoadMore = async () => {
    if (!result) return;
    setLoadingMore(true);
    try {
      const nextOffset = offset + PAGE_SIZE;
      const data = await fetchArtworks(query.trim(), nextOffset);
      setResult({ ...data, artworks: [...result.artworks, ...data.artworks] });
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoadingMore(false);
      onQuotaUsed();
    }
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    setDetailError("");
    try {
      const res = await fetchWithError(`/artsearch/artworks/${id}`);
      setDetail(await res.json());
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRandom = async () => {
    setRandomLoading(true);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await fetchWithError(`/artsearch/artworks/random`);
      setDetail(await res.json());
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setRandomLoading(false);
      setDetailLoading(false);
      onQuotaUsed();
    }
  };

  const closeDetail = () => { setDetail(null); setDetailError(""); };

  const hasMore = result ? result.artworks.length < result.available : false;

  return (
    <>
      <div className="bg-[#1e3a5f] rounded-2xl p-5 mb-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between mb-3 gap-y-2">
          <h2 className="text-white font-bold text-xl">
            Art Search
            {quota !== null && (
              <span className="text-slate-400 text-sm font-normal ml-2">({quota} requests left)</span>
            )}
          </h2>
          <button
            onClick={handleRandom}
            disabled={randomLoading}
            className="text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {randomLoading ? "..." : "Random Art"}
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. medieval knights, van gogh..."
            className="flex-1 bg-[#0a1628] text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {loading ? "..." : "Search"}
          </button>
        </form>
      </div>

      {/* Results popup */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); closeDetail(); } }}
        >
          <div className="bg-[#0f2239] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg">Results for "{query}"</h2>
                {result && !error && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {result.available.toLocaleString()} artworks available
                  </p>
                )}
              </div>
              <button
                onClick={() => { setOpen(false); closeDetail(); }}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {error ? (
                <p className="text-red-400 text-center py-10">{error}</p>
              ) : !result || result.artworks.length === 0 ? (
                <p className="text-slate-500 text-center py-10">No artworks found.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {result.artworks.map((art) => (
                      <ArtworkCard key={art.id} artwork={art} onClick={openDetail} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 transition-colors disabled:opacity-50 text-sm"
                      >
                        {loadingMore ? "Loading..." : `Load more (${result.artworks.length} / ${result.available})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail popup */}
      {(detail || detailLoading || detailError) && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}
        >
          <div className="bg-[#0f2239] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
              <h2 className="text-white font-bold text-lg">
                {detailError ? "Error" : detail?.title ?? "Loading..."}
              </h2>
              <button onClick={closeDetail} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {detailLoading ? (
                <p className="text-slate-500 text-center py-10">Loading...</p>
              ) : detailError ? (
                <p className="text-red-400 text-center py-10">{detailError}</p>
              ) : detail ? (
                <div className="space-y-4">
                  {detail.image && (
                    <img
                      src={detail.image}
                      alt={detail.title}
                      className="w-full min-h-[180px] max-h-64 object-contain rounded-xl bg-slate-800"
                    />
                  )}
                  {detail.author && (
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Author</span>
                      <p className="text-white font-semibold mt-0.5">{detail.author}</p>
                    </div>
                  )}
                  {(detail.start_date || detail.end_date) && (
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Date</span>
                      <p className="text-white mt-0.5">
                        {detail.start_date === detail.end_date
                          ? detail.start_date
                          : `${detail.start_date} – ${detail.end_date}`}
                      </p>
                    </div>
                  )}
                  {detail.art_types && detail.art_types.length > 0 && (
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Type</span>
                      <p className="text-white mt-0.5">{detail.art_types.join(", ")}</p>
                    </div>
                  )}
                  {detail.materials && detail.materials.length > 0 && (
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Materials</span>
                      <p className="text-white mt-0.5">{detail.materials.join(", ")}</p>
                    </div>
                  )}
                  {detail.description && (
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Description</span>
                      <p className="text-slate-300 text-sm mt-1 leading-relaxed">{detail.description}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArtworkCard({ artwork, onClick }: { artwork: Artwork; onClick: (id: number) => void }) {
  return (
    <div
      onClick={() => onClick(artwork.id)}
      className="bg-[#1e3a5f] rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:bg-[#234876] transition-colors"
    >
      {artwork.image ? (
        <img
          src={artwork.image}
          alt={artwork.title}
          className="w-16 h-16 object-cover rounded-lg shrink-0 bg-slate-700"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="w-16 h-16 rounded-lg shrink-0 bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
          No image
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate">{artwork.title}</h3>
        <p className="text-slate-500 text-xs mt-1">Click for details</p>
      </div>
    </div>
  );
}
