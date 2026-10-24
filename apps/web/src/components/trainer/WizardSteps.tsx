import { Num } from '@/components/ui/Num';

/**
 * The three-column step header: a bar, a numbered dot and a label per step.
 * Completed and current steps are orange; the current one also gets bright
 * label ink, so "where am I" and "how far along" read separately.
 */
export function WizardSteps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {labels.map((label, index) => {
        const step = index + 1;
        const reached = current >= step;
        const active = current === step;

        return (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <div
              className="h-2 rounded-full transition-colors duration-200"
              style={{ background: reached ? 'var(--color-accent)' : 'var(--color-border)' }}
            />
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid size-6 flex-none place-items-center rounded-full text-[12px] font-bold transition-colors duration-200"
                style={{
                  background: reached ? 'var(--color-accent)' : 'var(--color-border)',
                  color: reached ? 'var(--color-accent-ink)' : 'var(--color-text-muted)',
                }}
              >
                <Num>{step}</Num>
              </span>
              <span
                className="truncate text-[13.5px] font-semibold transition-colors duration-200"
                style={{ color: active ? 'var(--color-text)' : 'var(--color-text-faint)' }}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
