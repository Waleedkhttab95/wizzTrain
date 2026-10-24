'use client';

import { Suspense } from 'react';
import { ProgramBuilderScreen } from '@/components/trainer/ProgramBuilderScreen';
import { Loading } from '@/components/ui/Feedback';
import { ClientScreen } from '../_ClientScreen';

export default function ProgramPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientScreen title="برنامج التمارين" width="980px">
        {(client, reload) => <ProgramBuilderScreen client={client} onSaved={reload} />}
      </ClientScreen>
    </Suspense>
  );
}
