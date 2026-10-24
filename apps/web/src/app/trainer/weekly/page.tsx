'use client';

import { Suspense } from 'react';
import { WeeklySummaryScreen } from '@/components/trainer/WeeklySummaryScreen';
import { Loading } from '@/components/ui/Feedback';
import { ClientScreen } from '../_ClientScreen';

export default function WeeklyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientScreen title="الملخص الأسبوعي" width="1020px">
        {(client) => <WeeklySummaryScreen client={client} />}
      </ClientScreen>
    </Suspense>
  );
}
