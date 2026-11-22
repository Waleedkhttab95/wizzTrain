'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AccountMenu } from '@/components/client/AccountMenu';
import { cn } from '@/components/ui/cn';

/** Lucide paths at the handoff's stroke-width 2.75. */
const TABS = [
  { href: '/client', label: 'اليوم', d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z' },
  { href: '/client/workout', label: 'التمرين', d: 'M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10' },
  { href: '/client/nutrition', label: 'التغذية', d: 'M12 3a9 9 0 1 0 9 9M12 3v9h9' },
  { href: '/client/log', label: 'تسجيلي', d: 'M12 5v14M5 12h14' },
];

function TabIcon({ d }: { d: string }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * The client app has two shapes.
 *
 * Up to `lg` it is a phone app: a 430px column centred on whatever screen it
 * lands on, with a fixed bottom tab bar. That is how nearly every trainee
 * opens it, standing in the gym.
 *
 * From `lg` up it becomes a desktop layout: a wider container with the tabs
 * moved to a top bar, no bottom bar, and no phone frame. Screens opt into
 * wider arrangements with their own `lg:` classes; nothing is hidden or
 * added, so both shapes show the same content.
 *
 * The narrow column reserves the bottom bar's height once, here. Inner
 * screens must use `flex-1 min-h-0` rather than their own `calc(100vh-92px)`,
 * or a centred action ends up underneath the nav.
 */
export function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // `/client` must not light up for every nested route.
  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex min-h-dvh justify-center bg-surface-alt lg:bg-bg">
      <div
        className={cn(
          'relative flex min-h-dvh w-full flex-col overflow-hidden bg-bg',
          'max-w-[430px] shadow-[0_12px_32px_rgba(0,0,20,.6)]',
          // Desktop: drop the phone frame and let the column breathe.
          'lg:max-w-[1100px] lg:shadow-none',
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[120px] size-[320px] rounded-full blur-[34px]"
          style={{
            insetInlineEnd: '-100px',
            background:
              'radial-gradient(38% 42% at 36% 32%, rgba(237,32,150,.34), transparent 70%),' +
              'radial-gradient(42% 46% at 66% 40%, rgba(23,211,255,.26), transparent 72%),' +
              'radial-gradient(58% 62% at 40% 70%, rgba(0,0,184,.5), transparent 74%)',
          }}
        />

        {/* Desktop top bar. Hidden on phones, where the bottom bar leads. */}
        <header className="relative z-5 hidden border-b border-line bg-surface/80 backdrop-blur-sm lg:block">
          <nav
            aria-label="أقسام التطبيق"
            className="mx-auto flex max-w-[1000px] items-center gap-1 px-6 py-2.5"
          >
            {TABS.map((tab) => {
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-2.5 rounded-full px-4 py-2',
                    'text-[14.5px] font-semibold transition-colors',
                    active
                      ? 'bg-accent-tint text-accent-pressed'
                      : 'text-text-muted hover:text-text',
                  )}
                >
                  <TabIcon d={tab.d} />
                  {tab.label}
                </Link>
              );
            })}
            <AccountMenu className="ms-auto" />
          </nav>
        </header>

        <div className="relative z-1 flex flex-1 flex-col pb-[92px] lg:pb-10">{children}</div>

        {/* Phone bottom bar. The width cap matches the column above it. */}
        <nav
          aria-label="أقسام التطبيق"
          className="fixed bottom-0 z-5 flex w-full max-w-[430px] gap-1.5 border-t border-line bg-surface px-3 pt-2.5 pb-3.5 shadow-[0_-6px_22px_rgba(0,0,20,.5)] lg:hidden"
        >
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-[3px] rounded-[12px] px-0.5 py-1.5',
                  'text-[11.5px] font-semibold transition-colors',
                  active ? 'text-accent-pressed' : 'text-text-faint',
                )}
              >
                <span
                  className={cn(
                    'grid size-[34px] place-items-center rounded-full transition-colors',
                    active ? 'bg-accent-tint' : 'bg-transparent',
                  )}
                >
                  <TabIcon d={tab.d} />
                </span>
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
