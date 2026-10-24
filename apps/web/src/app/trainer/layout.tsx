'use client';

import { Role } from '@wizzapp/shared';
import type { ReactNode } from 'react';
import { TrainerShell } from '@/components/shell/TrainerShell';
import { Loading } from '@/components/ui/Feedback';
import { useRequireRole } from '@/lib/auth';

export default function TrainerLayout({ children }: { children: ReactNode }) {
  const user = useRequireRole(Role.Trainer);

  // Nothing renders until the role is confirmed, so a protected screen never
  // flashes before the redirect.
  if (!user) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Loading />
      </main>
    );
  }

  return <TrainerShell>{children}</TrainerShell>;
}
