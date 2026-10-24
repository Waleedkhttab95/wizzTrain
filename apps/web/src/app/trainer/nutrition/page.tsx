'use client';

import { Suspense } from 'react';
import { NutritionPlanScreen } from '@/components/trainer/NutritionPlanScreen';
import { Loading } from '@/components/ui/Feedback';
import { ClientScreen } from '../_ClientScreen';

export default function NutritionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientScreen title="خطة التغذية" width="940px">
        {(client, reload) => <NutritionPlanScreen client={client} onSaved={reload} />}
      </ClientScreen>
    </Suspense>
  );
}
