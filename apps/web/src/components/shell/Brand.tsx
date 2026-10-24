import { cn } from '@/components/ui/cn';

/** The orange disc mark plus the wordmark. Sizes track the handoff's 42px sidebar mark. */
export function Brand({ size = 42, className }: { size?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="grid flex-none place-items-center rounded-full bg-accent font-[family-name:var(--font-display)] font-bold text-accent-ink"
        style={{ width: size, height: size, fontSize: size * 0.48 }}
      >
        W
      </div>
      <span
        className="font-[family-name:var(--font-display)] font-bold"
        style={{ fontSize: size * 0.52, letterSpacing: '-.4px' }}
      >
        WizzTrain
      </span>
    </div>
  );
}
