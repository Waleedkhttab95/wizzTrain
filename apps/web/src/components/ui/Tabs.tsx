'use client';

import { cn } from './cn';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" className="flex min-w-max gap-1 border-b border-line">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative -mb-px shrink-0 border-b-2 px-4 py-3 text-[14px] font-bold transition-colors',
                selected
                  ? 'border-blaze text-text'
                  : 'border-transparent text-faint hover:text-muted',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'tnum ms-2 rounded px-1.5 py-0.5 text-[11px]',
                    selected ? 'bg-blaze-ghost text-blaze' : 'bg-surface-2 text-faint',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
