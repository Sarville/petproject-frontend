'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AVATARS, DEFAULT_AVATAR, generateRandomNickname } from '@/lib/nicknames';

export default function OnboardingPage() {
  const { user, loading, refetch } = useAuth();
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const generateNick = useCallback(async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/users/me/nickname/generate');
      if (res.ok) {
        const data = await res.json();
        setNickname(data.nickname);
      } else {
        setNickname(generateRandomNickname());
      }
    } catch {
      setNickname(generateRandomNickname());
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      generateNick();
    }
  }, [loading, user, generateNick]);

  const handleSkip = async () => {
    const fallbackNick = nickname || generateRandomNickname();
    await saveProfile(fallbackNick, DEFAULT_AVATAR);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('Please generate a nickname first');
      return;
    }
    await saveProfile(nickname, avatar);
  };

  const saveProfile = async (nick: string, av: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick, avatar: av }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to save profile');
        return;
      }
      await refetch();
      router.replace('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-terminal-wave-compact.svg" alt="PetProject" width={180} height={40} />
        </div>

        <div className="bg-[#0f2239] border border-slate-700 rounded-2xl p-8">
          <h1 className="text-white text-2xl font-bold mb-1">Welcome!</h1>
          <p className="text-slate-400 text-sm mb-8">Set up your profile to get started. You can always change this later.</p>

          {/* Nickname */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">Your Nickname</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#1e3a5f] border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm font-medium">
                {nickname || <span className="text-slate-500">Click Generate to get a nickname</span>}
              </div>
              <button
                onClick={generateNick}
                disabled={generating}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
              >
                {generating ? '...' : 'Generate'}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-1.5">Format: Adjective + Animal (e.g. Notorious Camel)</p>
          </div>

          {/* Avatar */}
          <div className="mb-8">
            <label className="block text-slate-300 text-sm font-medium mb-3">Choose Avatar</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    avatar === av
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-slate-600 hover:border-slate-400'
                  }`}
                >
                  <Image src={av} alt="avatar" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 bg-[#1e3a5f] rounded-xl p-3 mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 shrink-0">
              <Image src={avatar} alt="preview" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{nickname || 'Your Name'}</p>
              <p className="text-slate-400 text-xs">{user.email}</p>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !nickname}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? 'Saving...' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
