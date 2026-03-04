"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import type { Wish } from "@/types/wish";
import { basePath } from "@/lib/config";

const TITLE_MAX = 50;
const DESC_MAX = 300;

interface Props {
  wish: Wish | null;
  onClose: () => void;
  onSave: () => void;
}

export default function WishModal({ wish, onClose, onSave }: Props) {
  const [title, setTitle] = useState(wish?.title ?? "");
  const [description, setDescription] = useState(wish?.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(wish?.title ?? "");
    setDescription(wish?.description ?? "");
    setError("");
    // Focus title input when modal opens
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [wish]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (title.length > TITLE_MAX) {
      setError(`Title must not exceed ${TITLE_MAX} characters.`);
      return;
    }
    if (description.length > DESC_MAX) {
      setError(`Description must not exceed ${DESC_MAX} characters.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const url = wish ? `${basePath}/api/wishes/${wish.id}` : `${basePath}/api/wishes`;
      const method = wish ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Something went wrong.");
        return;
      }
      onSave();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const titleOver = title.length > TITLE_MAX;
  const descOver = description.length > DESC_MAX;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1e3a5f] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-white mb-5">
          {wish ? "Edit Wish" : "Add New Wish"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-slate-300 text-sm mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX + 10}
              placeholder="What do you wish for?"
              className={`w-full bg-[#0a1628] text-white rounded-lg px-4 py-2 border focus:outline-none transition-colors placeholder:text-slate-500 ${
                titleOver
                  ? "border-red-500 focus:border-red-400"
                  : "border-slate-600 focus:border-blue-500"
              }`}
            />
            <p
              className={`text-xs mt-1 text-right ${
                titleOver ? "text-red-400" : "text-slate-500"
              }`}
            >
              {title.length}/{TITLE_MAX}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 text-sm mb-1">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESC_MAX + 10}
              rows={3}
              placeholder="Add more details..."
              className={`w-full bg-[#0a1628] text-white rounded-lg px-4 py-2 border focus:outline-none transition-colors resize-none placeholder:text-slate-500 ${
                descOver
                  ? "border-red-500 focus:border-red-400"
                  : "border-slate-600 focus:border-blue-500"
              }`}
            />
            <p
              className={`text-xs mt-1 text-right ${
                descOver ? "text-red-400" : "text-slate-500"
              }`}
            >
              {description.length}/{DESC_MAX}
            </p>
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || titleOver || descOver}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : wish ? "Save Changes" : "Add Wish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
