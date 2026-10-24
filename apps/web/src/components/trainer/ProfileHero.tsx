'use client';

import { ApiRoutes, type ClientProfile } from '@wizzapp/shared';
import { useState } from 'react';
import { Num } from '@/components/ui/Num';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { decimal, initials, longDate } from '@/lib/format';
import { ResetClientPasswordDialog } from './ResetClientPasswordDialog';
import { avatarColor, lastLogLabel } from './clientStatus';

/**
 * The band at the top of a client's profile: who they are, when they started,
 * and the three figures the trainer checks first.
 */
export function ProfileHero({
  client,
  onChanged,
}: {
  client: ClientProfile;
  onChanged?: () => void;
}) {
  const { notify } = useToast();
  // Their latest logged weight, falling back to what the trainer recorded at
  // sign-up so the tile is never blank for a client who hasn't logged yet.
  const current = client.latestWeightKg ?? client.startWeightKg;
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const archived = client.archivedAt !== null;

  async function toggleArchive() {
    const route = ApiRoutes.clients.archive(client.id);
    setBusy(true);
    try {
      if (archived) {
        await api.del(route);
        notify('رجع المتدرب للوحة');
      } else {
        await api.post<void>(route);
        notify('تمت أرشفة المتدرب');
      }
      onChanged?.();
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر تنفيذ الطلب', 'bad');
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-[22px] rounded-[16px] bg-surface-alt p-[26px]">
      {archived && (
        <p className="w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-[13.5px] leading-relaxed text-text-muted">
          هذا المتدرب مؤرشف. سجلّه محفوظ كاملًا، لكنه خارج اللوحة والإحصاءات ولا يستطيع
          الدخول للتطبيق.
        </p>
      )}
      <div
        className="grid size-21 flex-none place-items-center rounded-full text-[26px] font-bold text-text"
        style={{ background: avatarColor(client.id) }}
      >
        {initials(client.name)}
      </div>

      <div className="min-w-[200px] flex-1">
        <h1 className="font-[family-name:var(--font-display)] text-[34px] leading-[1.15] font-bold">
          {client.name}
        </h1>
        <p className="text-[14px] text-text-muted">
          {client.startDate ? <>بدأ البرنامج {longDate(client.startDate)}</> : 'لم يُحدَّد تاريخ البدء'}
          {' · '}
          آخر تسجيل {lastLogLabel(client.lastLogDate)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="text-[13px] font-semibold text-text-muted underline-offset-4 transition-colors hover:text-accent-hover hover:underline"
          >
            تعيين كلمة مرور جديدة
          </button>
          <button
            type="button"
            onClick={toggleArchive}
            disabled={busy}
            className="text-[13px] font-semibold text-text-muted underline-offset-4 transition-colors hover:text-accent-hover hover:underline disabled:opacity-50"
          >
            {archived ? 'إرجاع للوحة المتدربين' : 'أرشفة المتدرب'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Tile label="الطول" value={client.heightCm ? `${decimal(client.heightCm)} سم` : '—'} />
        <Tile label="العمر" value={client.age ? `${client.age} سنة` : '—'} />
        <WeightTile current={current} goal={client.goalWeightKg} />
      </div>

      <ResetClientPasswordDialog
        open={resetOpen}
        clientId={client.id}
        clientName={client.name}
        onClose={() => setResetOpen(false)}
      />
    </header>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 rounded-[12px] bg-surface px-[18px] py-3">
      <p className="text-[12.5px] font-semibold text-text-muted">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-[22px] font-bold">{value}</p>
    </div>
  );
}

/** "92 → 82" on the orange tint — isolated so the arrow doesn't flip in RTL. */
function WeightTile({ current, goal }: { current: number | null; goal: number | null }) {
  return (
    <div className="min-w-[150px] rounded-[12px] bg-accent-tint px-[18px] py-3">
      <p className="text-[12.5px] font-semibold text-accent-pressed">الوزن · الهدف</p>
      <Num className="font-[family-name:var(--font-display)] text-[22px] font-bold text-accent-tint-ink">
        {current === null && goal === null
          ? '—'
          : `${current === null ? '—' : decimal(current)} → ${goal === null ? '—' : decimal(goal)}`}
      </Num>
    </div>
  );
}
