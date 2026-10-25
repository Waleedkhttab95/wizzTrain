'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ChangePasswordDialog } from '@/components/ui/ChangePasswordDialog';
import { cn } from '@/components/ui/cn';
import { useAuth } from '@/lib/auth';
import { initials } from '@/lib/format';
import { Brand } from './Brand';
import { Glow } from './Glow';
import { palette } from '@/lib/palette';

/**
 * Sidebar nav. Each item carries its own dot colour — the handoff uses colour
 * to distinguish sections rather than icons, so the dots are the only visual
 * key and must stay stable.
 */
interface NavItem {
  href: string;
  label: string;
  dot: string;
  /** Light up for nested routes too — a client profile still means "المتدربين". */
  prefix?: boolean;
}

const NAV: NavItem[] = [
  { href: '/trainer', label: 'المتدربين', dot: palette.accent },
  { href: '/trainer/add', label: 'متدرب جديد', dot: palette.success },
  { href: '/trainer/clients', label: 'ملف المتدرب', dot: palette.warn, prefix: true },
  { href: '/trainer/templates', label: 'جداول التمارين', dot: palette.successStrong, prefix: true },
  { href: '/trainer/program', label: 'برنامج التمارين', dot: palette.textMuted },
  { href: '/trainer/nutrition', label: 'خطة التغذية', dot: palette.successInk },
  { href: '/trainer/weekly', label: 'الملخص الأسبوعي', dot: palette.accentHover },
];

export function TrainerShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.prefix ? pathname.startsWith(item.href) : pathname === item.href;

  return (
    <div className="relative flex min-h-dvh">
      <Glow />

      {/* Sidebar. In RTL this sits on the right; `order` and logical padding
          keep it there without any left/right in the CSS. */}
      <aside className="relative z-2 hidden min-h-dvh w-[252px] flex-none flex-col gap-[26px] bg-surface-alt px-4 py-[22px] md:flex">
        <Brand className="px-1.5" />

        <nav className="flex flex-col gap-1.5">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-full px-3.5 py-3 text-start',
                  'font-[family-name:var(--font-display)] text-[16px] font-bold',
                  'transition-colors duration-150',
                  active
                    ? 'bg-accent-tint text-accent-pressed'
                    : 'text-text hover:bg-surface-alt',
                )}
              >
                <span
                  className="size-[9px] flex-none rounded-full"
                  style={{ background: item.dot }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Nudge card — pushed to the bottom of the rail. */}
        <div className="mt-auto flex flex-col gap-2 rounded-[14px] bg-surface p-4">
          <p className="font-[family-name:var(--font-display)] text-[17px] font-bold">
            مراجعة الأسبوع
          </p>
          <p className="text-[13px] leading-relaxed text-text-muted">
            راجع مين سجّل ومين تأخّر خلال آخر سبعة أيام.
          </p>
          <Link
            href="/trainer"
            className="mt-1 self-start rounded-full border border-line px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-surface-alt"
          >
            شوفهم
          </Link>
        </div>

        {/* Two actions plus the name no longer fit on one line, so the
            account row stacks and the actions share the line below it. */}
        <div className="flex flex-col gap-2 px-1.5">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 flex-none place-items-center rounded-full bg-lime text-[14px] font-bold text-bg">
              {initials(user?.name ?? '')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{user?.name}</p>
              <p className="text-[12px] text-text-faint">مدرب</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPasswordOpen(true)}
              className="text-[13px] font-semibold text-text-muted transition-colors hover:text-accent-pressed"
            >
              كلمة المرور
            </button>
            <button
              onClick={logout}
              className="text-[13px] font-semibold text-text-muted transition-colors hover:text-accent-pressed"
            >
              خروج
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header — the console is desktop-first, but it must not break
          on a phone the trainer happens to open it on. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
          <Brand size={32} />
          <button
            onClick={logout}
            className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-semibold text-text-muted"
          >
            خروج
          </button>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2.5 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
                isActive(item)
                  ? 'bg-accent-tint text-accent-pressed'
                  : 'text-text-muted',
              )}
            >
              <span className="size-2 flex-none rounded-full" style={{ background: item.dot }} />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="relative z-1 min-w-0 flex-1 px-4 pt-6 pb-14 md:px-10 md:pt-8">
          {children}
        </main>
      </div>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
