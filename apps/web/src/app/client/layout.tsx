'use client';

import { Role } from '@wizzapp/shared';
import type { ReactNode } from 'react';
import { ClientShell } from '@/components/shell/ClientShell';
import { Loading } from '@/components/ui/Feedback';
import { useRequireRole } from '@/lib/auth';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const user = useRequireRole(Role.Client);

  if (!user) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Loading />
      </main>
    );
  }

  return <ClientShell>{children}</ClientShell>;
}
