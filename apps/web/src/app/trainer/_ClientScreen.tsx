'use client';

import type { ClientProfile } from '@wizzapp/shared';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { ErrorNote, Loading } from '@/components/ui/Feedback';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';

/**
 * Shared frame for the per-client builder screens, which are reached as
 * `/trainer/program?client=<id>` from a client's profile.
 *
 * These screens still wear the pre-handoff styling — they are next in the
 * redesign. Wrapping them keeps the feature working rather than parking it
 * behind a placeholder.
 */
export function ClientScreen({
  title,
  width = '1060px',
  children,
}: {
  title: string;
  /** Content cap — the handoff sizes each screen differently. */
  width?: string;
  children: (client: ClientProfile, reload: () => void) => ReactNode;
}) {
  const clientId = useSearchParams().get('client');

  const profile = useApi<ClientProfile | null>(
    (signal) =>
      clientId
        ? api.get<ClientProfile>(`/clients/${clientId}`, undefined, signal)
        : Promise.resolve(null),
    [clientId],
  );

  if (!clientId) {
    return (
      <div className="flex max-w-[720px] flex-col gap-5">
        <h1 className="font-[family-name:var(--font-display)] text-[36px] font-bold">{title}</h1>
        <div className="flex flex-col items-start gap-3 rounded-[16px] border border-dashed border-border-dashed p-8">
          <p className="text-[15px] leading-relaxed text-text-muted">
            اختر المتدرب أولاً — هذه الشاشة تُفتح من ملف المتدرب.
          </p>
          <Link
            href="/trainer"
            className="rounded-full border border-line px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-surface-alt"
          >
            اختر متدربًا
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: width }}>
      <Link
        href={`/trainer/clients/${clientId}`}
        className="w-fit text-[14px] font-semibold text-text-muted transition-colors hover:text-accent-pressed"
      >
        ← رجوع لملف المتدرب
      </Link>

      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-[36px] font-bold">{title}</h1>
        {profile.data && <span className="text-[15px] text-text-muted">{profile.data.name}</span>}
      </div>

      {profile.loading ? (
        <Loading />
      ) : profile.error || !profile.data ? (
        <ErrorNote
          message={profile.error?.message ?? 'تعذّر تحميل بيانات المتدرب'}
          onRetry={profile.reload}
        />
      ) : (
        children(profile.data, profile.reload)
      )}
    </div>
  );
}
