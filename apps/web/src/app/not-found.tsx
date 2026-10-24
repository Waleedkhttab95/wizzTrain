import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="stat-num text-[64px] text-blaze">404</p>
        <h1 className="text-[19px] font-bold">الصفحة غير موجودة</h1>
        <Link
          href="/"
          className="rounded-xl border border-line bg-surface-2 px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-surface-3"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
