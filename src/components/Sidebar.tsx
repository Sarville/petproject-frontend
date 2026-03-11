'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface NavItem {
  label: string;
  menu: string;
  icon: React.ReactNode;
}

const userNavItems: NavItem[] = [
  {
    label: 'Wishes',
    menu: '',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    label: 'External APIs',
    menu: 'apis',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    label: 'Account',
    menu: 'account',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMenu = searchParams.get('menu') ?? '';

  const navigate = (menu: string) => {
    if (menu === '') {
      router.push('/');
    } else {
      router.push(`/?menu=${menu}`);
    }
  };

  return (
    <aside className="w-60 h-screen bg-[#0f2239] border-r border-slate-700 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/logo-terminal-wave-compact.svg" alt="PetProject" width={140} height={32} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {userNavItems.map((item) => {
          const isActive = currentMenu === item.menu;
          return (
            <button
              key={item.menu}
              onClick={() => navigate(item.menu)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
