import type { ClientSummary } from '@wizzapp/shared';
import Link from 'next/link';
import { Num } from '@/components/ui/Num';
import { initials } from '@/lib/format';
import { STATUS, avatarColor, goalLine, lastLogLabel } from './clientStatus';

/**
 * One client on the roster. The whole card is the link — the trainer's target
 * is the person, not a small "view" affordance.
 */
export function ClientCard({ client }: { client: ClientSummary }) {
  const status = STATUS[client.status];

  return (
    <Link
      href={`/trainer/clients/${client.id}`}
      className="flex flex-col gap-4 rounded-[16px] bg-surface p-5 text-start border border-line-soft transition-shadow duration-150 hover:shadow-[0_6px_18px_rgba(44,24,16,.10)]"
    >
      <div className="flex w-full items-center gap-3">
        <div
          className="grid size-[54px] flex-none place-items-center rounded-full text-[17px] font-bold text-text"
          style={{ background: avatarColor(client.id) }}
        >
          {initials(client.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[family-name:var(--font-display)] text-[20px] leading-tight font-bold">
            {client.name}
          </h3>
          <GoalText client={client} />
        </div>

        <span
          aria-hidden="true"
          className="size-3 flex-none rounded-full"
          style={{ background: status.dot }}
        />
      </div>

      <div className="flex w-full items-center justify-between gap-2.5">
        <span
          className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
          style={{ background: status.chipBg, color: status.chipInk }}
        >
          {status.label}
        </span>
        <span className="text-[13px] text-text-faint">
          آخر تسجيل: {lastLogLabel(client.lastLogDate)}
        </span>
      </div>

      {/* Seven days, oldest first, ending today. */}
      <div
        className="flex w-full gap-1"
        role="img"
        aria-label={`سجّل ${client.daysLoggedThisWeek} من آخر 7 أيام`}
      >
        {client.weekStrip.map((logged, index) => (
          <span
            key={index}
            className="h-2 flex-1 rounded-full"
            style={{ background: logged ? status.dot : 'var(--color-border)' }}
          />
        ))}
      </div>
    </Link>
  );
}

/**
 * Every numeric run is isolated on its own. Without that, a signed number
 * inside Arabic text renders with the sign on the wrong end — "+0.3" becomes
 * "0.3+".
 */
function GoalText({ client }: { client: ClientSummary }) {
  const { delta, target, week } = goalLine(client);

  if (delta === null && target === null && week === null) {
    return <p className="truncate text-[13px] text-text-muted">لم يُحدَّد هدف بعد</p>;
  }

  return (
    <p className="truncate text-[13px] text-text-muted">
      {delta !== null && (
        <>
          هدف: <Num>{delta}</Num> كجم
        </>
      )}
      {target !== null && (
        <>
          هدف: <Num>{target}</Num> كجم
        </>
      )}
      {(delta !== null || target !== null) && week !== null && ' · '}
      {week !== null && (
        <>
          أسبوع <Num>{week}</Num>
        </>
      )}
    </p>
  );
}

/** The four figures above the roster. */
export function StatTile({
  label,
  value,
  tone = 'plain',
}: {
  label: string;
  value: string;
  tone?: 'plain' | 'lime' | 'accent';
}) {
  const tones = {
    plain: { bg: 'bg-surface', label: 'text-text-muted', value: 'text-text' },
    lime: { bg: 'bg-lime-tint', label: 'text-lime-strong', value: 'text-lime-ink' },
    accent: { bg: 'bg-accent-tint', label: 'text-accent-pressed', value: 'text-accent-tint-ink' },
  }[tone];

  return (
    <div className={`rounded-[14px] px-5 py-[18px] ${tones.bg}`}>
      <p className={`text-[13px] font-semibold ${tones.label}`}>{label}</p>
      <Num className={`stat-num mt-1 text-[34px] ${tones.value}`}>{value}</Num>
    </div>
  );
}
