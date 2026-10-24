import type { ClientProfile } from '@wizzapp/shared';
import Link from 'next/link';
import { Num } from '@/components/ui/Num';
import { longDate } from '@/lib/format';
import { palette } from '@/lib/palette';

/**
 * The "البرنامج والتغذية" tab: a read-only summary of each, with the edit
 * action pointing at the dedicated builder screens. Empty states use the lime
 * card from the handoff — a client with no plan is a to-do, not an error.
 */
export function ProfileProgram({ client }: { client: ClientProfile }) {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
      <ProgramCard client={client} />
      <NutritionCard client={client} />
    </div>
  );
}

function ProgramCard({ client }: { client: ClientProfile }) {
  const program = client.activeProgram;

  if (!program) {
    return (
      <EmptyCard
        tone="accent"
        icon={<DumbbellIcon />}
        title="ما فيه برنامج تدريبي بعد"
        body="المتدرب ما يقدر يبدأ قبل ما تجهّز أيام التمرين. ابدأ بيوم واحد وكمّل بعدين."
        actionLabel="ابنِ البرنامج"
        href={`/trainer/program?client=${client.id}`}
      />
    );
  }

  const totalExercises = program.days.reduce((sum, day) => sum + day.exercises.length, 0);

  return (
    <section className="flex flex-col gap-3 rounded-[16px] bg-surface p-6">
      <h3 className="font-[family-name:var(--font-display)] text-[22px] font-bold">
        {program.title}
      </h3>
      <p className="text-[14px] text-text-muted">
        <Num>{program.days.length}</Num> أيام بالأسبوع · <Num>{totalExercises}</Num> تمرين · بدأ{' '}
        {longDate(program.startDate)}
      </p>

      <ul className="mt-1 flex flex-col gap-2">
        {program.days.map((day) => (
          <li
            key={day.id}
            className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3 text-[14px]"
          >
            <span className="truncate font-semibold">{day.dayLabel}</span>
            <span className="flex-none text-text-muted">
              <Num>{day.exercises.length}</Num> تمارين
            </span>
          </li>
        ))}
        {program.days.length === 0 && (
          <li className="rounded-2xl bg-bg px-4 py-3 text-[13.5px] text-text-faint">
            البرنامج فاضي — ما فيه أيام بعد.
          </li>
        )}
      </ul>

      <Link
        href={`/trainer/program?client=${client.id}`}
        className="mt-1.5 flex h-[46px] w-fit items-center rounded-full bg-accent px-[22px] font-[family-name:var(--font-display)] text-[16px] font-bold text-accent-ink transition-colors hover:bg-accent-hover"
      >
        تعديل البرنامج
      </Link>
    </section>
  );
}

function NutritionCard({ client }: { client: ClientProfile }) {
  const plan = client.activeNutritionPlan;

  if (!plan) {
    return (
      <EmptyCard
        tone="lime"
        icon={<ClockIcon />}
        title="ما فيه خطة تغذية بعد"
        body="المتدرب يشوف أهداف السعرات والماكروز أول ما تجهّز الخطة. دقيقتين وتخلص."
        actionLabel="ابنِ خطة التغذية"
        href={`/trainer/nutrition?client=${client.id}`}
      />
    );
  }

  const macros = [
    { label: 'بروتين', value: plan.proteinG },
    { label: 'كارب', value: plan.carbsG },
    { label: 'فات', value: plan.fatG },
  ];

  return (
    <section className="flex flex-col gap-3 rounded-[16px] bg-surface p-6">
      <h3 className="font-[family-name:var(--font-display)] text-[22px] font-bold">خطة التغذية</h3>

      <div className="rounded-[12px] bg-accent-tint px-5 py-3.5">
        <p className="text-[12.5px] font-semibold text-accent-pressed">السعرات اليومية</p>
        <p className="font-[family-name:var(--font-display)] text-[30px] font-bold text-accent-tint-ink">
          <Num>{plan.dailyCalories.toLocaleString('en-US')}</Num>
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {macros.map((macro) => (
          <li
            key={macro.label}
            className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3 text-[14px]"
          >
            <span className="font-semibold">{macro.label}</span>
            <span className="text-text-muted">
              <Num>{macro.value}</Num> جم
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3 text-[14px]">
          <span className="font-semibold">الوجبات</span>
          <span className="text-text-muted">
            <Num>{plan.meals.length}</Num> وجبات
          </span>
        </li>
      </ul>

      <Link
        href={`/trainer/nutrition?client=${client.id}`}
        className="mt-1.5 flex h-[46px] w-fit items-center rounded-full bg-lime-strong px-[22px] font-[family-name:var(--font-display)] text-[16px] font-bold text-lime-tint transition-colors hover:bg-lime-ink"
      >
        تعديل الخطة
      </Link>
    </section>
  );
}

function EmptyCard({
  tone,
  icon,
  title,
  body,
  actionLabel,
  href,
}: {
  tone: 'lime' | 'accent';
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  href: string;
}) {
  const styles =
    tone === 'lime'
      ? {
          card: 'bg-lime-tint',
          circle: 'bg-lime-tint-3',
          title: 'text-lime-ink-strong',
          body: 'text-lime-ink',
          button: 'bg-lime-strong text-lime-tint hover:bg-lime-ink',
        }
      : {
          card: 'bg-accent-tint',
          circle: 'bg-accent-tint-3',
          title: 'text-accent-tint-ink',
          body: 'text-accent-pressed',
          button: 'bg-accent text-accent-ink hover:bg-accent-hover',
        };

  return (
    <section className={`flex flex-col items-start gap-3.5 rounded-[16px] p-6 ${styles.card}`}>
      <div className={`grid size-14 place-items-center rounded-full ${styles.circle}`}>{icon}</div>
      <h3
        className={`font-[family-name:var(--font-display)] text-[22px] font-bold ${styles.title}`}
      >
        {title}
      </h3>
      <p className={`text-[14px] leading-relaxed ${styles.body}`}>{body}</p>
      <Link
        href={href}
        className={`flex h-[46px] items-center rounded-full px-[22px] font-[family-name:var(--font-display)] text-[16px] font-bold transition-colors ${styles.button}`}
      >
        {actionLabel}
      </Link>
    </section>
  );
}

/* Lucide paths, stroke-width 2.75 per the handoff. */
function ClockIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke={palette.successInk}
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke={palette.accentTintInk}
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10" />
    </svg>
  );
}
