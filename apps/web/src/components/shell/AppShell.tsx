'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';
import { useAuth } from '@/lib/auth';
import { initials } from '@/lib/format';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Match nested routes too — a client detail page still lights up "العملاء". */
  prefix?: boolean;
}

/**
 * One shell for both roles. Bottom tab bar on phones (the client logs from
 * their phone at the gym), a side rail on desktop (the trainer works at a desk).
 */
export function AppShell({
  nav,
  title,
  children,
}: {
  nav: NavItem[];
  title: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.prefix ? pathname.startsWith(item.href) : pathname === item.href;

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-s-0 border-e border-line bg-surface md:flex">
        <div className="flex items-center gap-2.5 border-b border-line-soft px-5 py-5">
          <Barbell />
          <span className="text-[15px] font-black">{title}</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-colors',
                isActive(item)
                  ? 'bg-blaze-ghost text-blaze'
                  : 'text-muted hover:bg-surface-2 hover:text-text',
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <UserFooter name={user?.name ?? ''} email={user?.email ?? ''} onLogout={logout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2.5">
            <Barbell />
            <span className="text-[15px] font-black">{title}</span>
          </div>
          <button
            onClick={logout}
            className="grid size-9 place-items-center rounded-lg border border-line text-faint transition-colors hover:text-text"
            aria-label="تسجيل الخروج"
          >
            <LogoutIcon />
          </button>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>

        {/* Mobile tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-flow-col border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors',
                isActive(item) ? 'text-blaze' : 'text-faint',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function UserFooter({
  name,
  email,
  onLogout,
}: {
  name: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-line-soft p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-[13px] font-bold text-muted">
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold">{name}</p>
        <p dir="ltr" className="truncate text-start text-[11.5px] text-faint">
          {email}
        </p>
      </div>
      <button
        onClick={onLogout}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-bad"
        aria-label="تسجيل الخروج"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}

function Barbell() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden="true">
      <path d="M4 11v10M8 8v16" stroke="var(--color-blaze)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 11v10M24 8v16" stroke="var(--color-blaze)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 16h16" stroke="var(--color-blaze)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 14v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" strokeLinecap="round" />
      <path d="M9 10h8m0 0-2.5-2.5M17 10l-2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
