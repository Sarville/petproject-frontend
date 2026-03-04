import { useState, type FormEvent } from "react";

const PAGE_SIZE = 10;
const PREVIEW_SIZE = 360;

interface Meme {
  id: number;
  url: string;
  description?: string;
}

interface SearchResult {
  available: number;
  memes: Meme[];
}

interface Props {
  quota: number | null;
  onQuotaUsed: () => void;
}

async function fetchWithError(url: string): Promise<Response> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res;
}

export default function MemeSearch({ quota, onQuotaUsed }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<Meme | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [randomMeme, setRandomMeme] = useState<Meme | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState("");

  const fetchMemes = async (q: string, off: number): Promise<SearchResult> => {
    const params = new URLSearchParams({ keywords: q, number: String(PAGE_SIZE), offset: String(off) });
    const res = await fetchWithError(`/humorapi/memes/search?${params}`);
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
      const data = await fetchMemes(query.trim(), 0);
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
      const data = await fetchMemes(query.trim(), nextOffset);
      setResult({ ...data, memes: [...result.memes, ...data.memes] });
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoadingMore(false);
      onQuotaUsed();
    }
  };

  const handleRandom = async () => {
    setRandomLoading(true);
    setRandomMeme(null);
    setRandomError("");
    try {
      const res = await fetchWithError(`/humorapi/memes/random`);
      setRandomMeme(await res.json());
    } catch (err) {
      setRandomError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setRandomLoading(false);
      onQuotaUsed();
    }
  };

  const closeRandom = () => { setRandomMeme(null); setRandomError(""); };

  const hasMore = result ? result.memes.length < result.available : false;

  return (
    <>
      <div className="bg-[#1e3a5f] rounded-2xl p-5 mb-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between mb-3 gap-y-2">
          <h2 className="text-white font-bold text-xl">
            Meme Search
            {quota !== null && (
              <span className="text-slate-400 text-sm font-normal ml-2">({quota} requests left today)</span>
            )}
          </h2>
          <button
            onClick={handleRandom}
            disabled={randomLoading}
            className="text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {randomLoading ? "..." : "Random Meme"}
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. cats, programming, monday..."
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
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setHovered(null); } }}
        >
          <div className="bg-[#0f2239] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg">Results for "{query}"</h2>
                {result && !error && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {result.available.toLocaleString()} memes available
                  </p>
                )}
              </div>
              <button
                onClick={() => { setOpen(false); setHovered(null); }}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {error ? (
                <p className="text-red-400 text-center py-10">{error}</p>
              ) : !result || result.memes.length === 0 ? (
                <p className="text-slate-500 text-center py-10">No memes found.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {result.memes.map((meme) => (
                      <div
                        key={meme.id}
                        className="aspect-square rounded-lg overflow-hidden bg-slate-800 cursor-pointer"
                        onMouseEnter={(e) => {
                          setHovered(meme);
                          setHoverPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <img
                          src={meme.url}
                          alt={meme.description ?? "meme"}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 rounded-lg bg-[#1e3a5f] text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 transition-colors disabled:opacity-50 text-sm"
                      >
                        {loadingMore ? "Loading..." : `Load more (${result.memes.length} / ${result.available})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hover preview — 3× card size */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl overflow-hidden shadow-2xl border border-slate-600"
          style={{
            width: PREVIEW_SIZE,
            left: Math.min(hoverPos.x + 16, window.innerWidth - PREVIEW_SIZE - 8),
            top: Math.max(8, hoverPos.y - PREVIEW_SIZE / 2),
          }}
        >
          <img
            src={hovered.url}
            alt={hovered.description ?? "meme"}
            className="w-full bg-slate-900 object-contain"
            style={{ height: PREVIEW_SIZE }}
          />
        </div>
      )}

      {/* Random meme popup — same size as hover preview */}
      {(randomMeme || randomLoading || randomError) && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeRandom(); }}
        >
          <div className="bg-[#0f2239] rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[360px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 shrink-0">
              <h2 className="text-white font-bold">{randomError ? "Error" : "Random Meme"}</h2>
              <button onClick={closeRandom} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-4">
              {randomLoading ? (
                <div className="flex items-center justify-center bg-slate-800 rounded-xl h-64 sm:h-[360px]">
                  <p className="text-slate-500">Loading...</p>
                </div>
              ) : randomError ? (
                <p className="text-red-400 text-center py-10">{randomError}</p>
              ) : randomMeme ? (
                <div className="space-y-3">
                  <img
                    src={randomMeme.url}
                    alt={randomMeme.description ?? "meme"}
                    className="w-full min-h-[180px] max-h-64 sm:max-h-[360px] rounded-xl bg-slate-800 object-contain"
                  />
                  {randomMeme.description && (
                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{randomMeme.description}</p>
                  )}
                  <div className="flex justify-center">
                    <button
                      onClick={handleRandom}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
                    >
                      Try another
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
