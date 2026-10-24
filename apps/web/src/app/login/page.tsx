'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ErrorNote, Spinner } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/api';
import { homeFor, useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in — don't make them log in twice.
  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user.role));
  }, [user, loading, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await login(email.trim(), password);
      router.replace(homeFor(me.role));
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'تعذّر تسجيل الدخول، حاول مرة أخرى',
      );
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      {/* Ground texture: a single heat wash and a faint grid, nothing more. */}
      <div className="pointer-events-none absolute inset-0 grid-ghost opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 start-1/2 size-[520px] -translate-x-1/2 rounded-full bg-blaze/12 blur-[110px]"
        aria-hidden="true"
      />

      <div className="rise relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Mark />
          <div>
            <h1 className="text-[26px] leading-tight font-black">منصة التدريب الشخصي</h1>
            <p className="mt-1.5 text-[14px] text-muted">سجّل دخولك لمتابعة برنامجك</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-[12px] border border-line bg-surface/80 p-6 backdrop-blur-sm"
          noValidate
        >
          {error && <ErrorNote message={error} />}

          <Field
            label="البريد الإلكتروني"
            type="email"
            inputMode="email"
            autoComplete="username"
            dir="ltr"
            className="text-start"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Field
            label="كلمة المرور"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            className="text-start"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="blaze" size="lg" full loading={submitting} className="mt-1">
            {submitting ? 'جارٍ الدخول…' : 'دخول'}
          </Button>

          {/* The backend has no password-reset route, so we don't promise one. */}
          <p className="text-center text-[12.5px] leading-relaxed text-faint">
            نسيت كلمة المرور؟ تواصل مع مدربك — هو من ينشئ الحسابات.
          </p>
        </form>
      </div>
    </main>
  );
}

/** A stacked-plate barbell end, drawn rather than imported. */
function Mark() {
  return (
    <div className="grid size-14 place-items-center rounded-2xl border border-blaze/30 bg-blaze-ghost">
      <svg viewBox="0 0 32 32" className="size-7" fill="none" aria-hidden="true">
        <path d="M4 11v10M8 8v16" stroke="var(--color-blaze)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 11v10M24 8v16" stroke="var(--color-blaze)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 16h16" stroke="var(--color-blaze)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
