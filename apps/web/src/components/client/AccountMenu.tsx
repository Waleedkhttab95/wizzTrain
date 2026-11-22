'use client';

import { useEffect, useRef, useState } from 'react';
import { ChangePasswordDialog } from '@/components/ui/ChangePasswordDialog';
import { cn } from '@/components/ui/cn';
import { useAuth } from '@/lib/auth';
import { initials } from '@/lib/format';

/**
 * The trainee's account control: their initials, opening a short menu with
 * the two things they can do to their own account.
 *
 * It lives in two places because the app has two shapes — on a phone it is
 * the avatar in the home screen's header, and from `lg` up it sits at the end
 * of the top bar, where it is reachable from every tab. Each instance hides
 * itself at the other size, so only one is ever on screen.
 */
export function AccountMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    // A click anywhere outside closes it, including on the other menu.
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={cn('relative flex-none', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="حسابي"
        className="grid size-[46px] place-items-center rounded-full bg-lime text-[15px] font-bold text-bg transition-opacity hover:opacity-85 lg:size-10 lg:text-[14px]"
      >
        {initials(user?.name ?? '')}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="حسابي"
          // Anchored to the button's inline-end so the panel opens inward.
          // The button sits at the end of its row in both shapes, so
          // anchoring to the start would hang it off the edge of the screen.
          className="absolute top-[calc(100%+8px)] z-20 flex w-56 flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_12px_32px_rgba(0,0,20,.6)]"
          style={{ insetInlineEnd: 0 }}
        >
          <p className="truncate border-b border-line-soft px-4 py-3 text-[13px] text-text-muted">
            {user?.email}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPasswordOpen(true);
            }}
            className="px-4 py-3 text-start text-[14.5px] font-semibold transition-colors hover:bg-surface-alt"
          >
            تغيير كلمة المرور
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="border-t border-line-soft px-4 py-3 text-start text-[14.5px] font-semibold text-accent-pressed transition-colors hover:bg-surface-alt"
          >
            تسجيل الخروج
          </button>
        </div>
      )}

      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
