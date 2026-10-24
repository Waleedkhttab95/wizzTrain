import type { AdherenceStatus, ClientSummary } from '@wizzapp/shared';
import { palette } from '@/lib/palette';

/**
 * The status vocabulary from the handoff. Colour, chip and wording travel
 * together — a status is never rendered as a bare colour, because colour alone
 * is not an accessible signal.
 */
export const STATUS = {
  committed: {
    label: 'منتظم بالتسجيل',
    filter: 'ملتزم',
    dot: palette.success,
    chipBg: palette.successTint,
    chipInk: palette.successInk,
  },
  partial: {
    label: 'تسجيل متقطع',
    filter: 'متوسط',
    dot: palette.warn,
    chipBg: '#fdf1dc',
    chipInk: '#7a5208',
  },
  behind: {
    label: 'ما سجّل من فترة',
    filter: 'متأخر',
    dot: palette.accent,
    chipBg: palette.accentTint,
    chipInk: palette.accentTintInk,
  },
} as const satisfies Record<AdherenceStatus, unknown>;

/**
 * Avatar fills, assigned deterministically so a client keeps their colour.
 * Light warm tints rather than saturated hues: the initials sit on top in
 * the ink colour, which no saturated fill in this palette reads well against.
 */
const AVATAR_COLORS = ['#ffe3d5', '#ffd6c2', '#d7e7dd', '#c5dbce', '#fdf1dc', '#f0e2d2'];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * The line under the name on a roster card: "هدف: -6 كجم · أسبوع 5".
 *
 * Returned as parts rather than one string so the card can isolate each
 * numeric run. Concatenating it into a single string and dropping it into
 * RTL text renders "+0.3" as "0.3+" — the sign jumps to the wrong end.
 */
export interface GoalLine {
  /** The signed remaining difference, e.g. "-6" — already formatted. */
  delta: string | null;
  /** The absolute target, used when we don't know their current weight. */
  target: string | null;
  /** Which week of the programme they are in. */
  week: number | null;
}

export function goalLine(client: ClientSummary): GoalLine {
  let delta: string | null = null;
  let target: string | null = null;

  // Their latest logged weight if they've started logging, otherwise the
  // weight the trainer recorded at sign-up — so the delta is meaningful from
  // day one rather than waiting for the first daily log.
  const current = client.latestWeightKg ?? client.startWeightKg;

  if (client.goalWeightKg !== null && current !== null) {
    const difference = Math.round((client.goalWeightKg - current) * 10) / 10;
    delta = `${difference > 0 ? '+' : ''}${difference}`;
  } else if (client.goalWeightKg !== null) {
    target = String(client.goalWeightKg);
  }

  return { delta, target, week: weeksSince(client.startDate) };
}

/** Which week of the programme the client is in, 1-based. */
function weeksSince(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  if (Number.isNaN(start)) return null;

  const elapsed = Date.now() - start;
  if (elapsed < 0) return null;
  return Math.floor(elapsed / (7 * 86_400_000)) + 1;
}

/** "اليوم" / "أمس" / "قبل 3 أيام" — how the roster words recency. */
export function lastLogLabel(isoDate: string | null): string {
  if (!isoDate) return 'لم يسجّل بعد';

  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - then) / 86_400_000);

  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days === 2) return 'قبل يومين';
  if (days <= 10) return `قبل ${days} أيام`;
  return `قبل ${Math.floor(days / 7)} أسابيع`;
}
