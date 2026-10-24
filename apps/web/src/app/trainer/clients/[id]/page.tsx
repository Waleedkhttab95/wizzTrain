'use client';

import type { ClientProfile } from '@wizzapp/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ProfileHero } from '@/components/trainer/ProfileHero';
import { ProfileLogs } from '@/components/trainer/ProfileLogs';
import { ProfileProgram } from '@/components/trainer/ProfileProgram';
import { cn } from '@/components/ui/cn';
import { ErrorNote, Loading } from '@/components/ui/Feedback';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';

const TABS = [
  { id: 'program', label: 'البرنامج والتغذية' },
  { id: 'logs', label: 'السجل اليومي' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabId>('program');

  const profile = useApi<ClientProfile>(
    (signal) => api.get<ClientProfile>(`/clients/${id}`, undefined, signal),
    [id],
  );

  return (
    <div className="flex max-w-[1060px] flex-col gap-[22px]">
      <Link
        href="/trainer"
        className="w-fit text-[14px] font-semibold text-text-muted transition-colors hover:text-accent-pressed"
      >
        ← رجوع للمتدربين
      </Link>

      {profile.loading ? (
        <Loading />
      ) : profile.error || !profile.data ? (
        <ErrorNote
          message={profile.error?.message ?? 'تعذّر تحميل بيانات المتدرب'}
          onRetry={profile.reload}
        />
      ) : (
        <>
          <ProfileHero client={profile.data} onChanged={profile.reload} />

          <div
            role="tablist"
            className="flex flex-wrap gap-2 self-start rounded-full bg-surface-alt p-[5px]"
          >
            {TABS.map((option) => {
              const on = tab === option.id;
              return (
                <button
                  key={option.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(option.id)}
                  className={cn(
                    'rounded-full px-5 py-2.5 text-[14.5px] font-semibold transition-colors duration-150',
                    on ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div key={tab} className="rise">
            {tab === 'program' ? (
              <ProfileProgram client={profile.data} />
            ) : (
              <ProfileLogs clientId={profile.data.id} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
