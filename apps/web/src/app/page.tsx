import type { Metadata } from 'next';
import { Landing } from '@/components/marketing/Landing';

export const metadata: Metadata = {
  title: 'WizzTrain — برامج تدريب ومتابعة يومية في مكان واحد',
  description:
    'منصة عربية لإدارة التدريب الشخصي: جداول تمارين جاهزة، خطط غذائية، وتسجيل يومي يخلّصه المتدرب في أقل من دقيقة.',
};

/**
 * The public front door. It no longer bounces straight to /login — every
 * call to action here routes a visitor to the login screen and a signed-in
 * trainer or client to their own dashboard.
 */
export default function Home() {
  return <Landing />;
}
