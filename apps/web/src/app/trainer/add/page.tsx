'use client';

import type { ClientProfile } from '@wizzapp/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { WizardSteps } from '@/components/trainer/WizardSteps';
import { ErrorNote } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { GhostPill, PillField, PillTextArea, PrimaryPill } from '@/components/ui/PillField';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { todayIso } from '@/lib/format';
import { suggestPassword } from '@/lib/password';

const STEP_LABELS = ['بيانات أساسية', 'بيانات جسدية', 'الهدف'];

interface Form {
  name: string;
  email: string;
  password: string;
  phone: string;
  heightCm: string;
  age: string;
  startWeightKg: string;
  startDate: string;
  goalWeightKg: string;
  goalNote: string;
}

const BLANK: Form = {
  name: '',
  email: '',
  password: '',
  phone: '',
  heightCm: '',
  age: '',
  startWeightKg: '',
  startDate: todayIso(),
  goalWeightKg: '',
  goalNote: '',
};

type Errors = Partial<Record<keyof Form, string>>;

export default function AddClientPage() {
  const router = useRouter();
  const { notify } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(() => ({ ...BLANK, password: suggestPassword() }));
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Form>(field: K, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    // Clear the field's error as soon as they start correcting it.
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  /** The live "الفرق المطلوب" tile on step 3. */
  const difference = useMemo(() => {
    const from = Number(form.startWeightKg);
    const to = Number(form.goalWeightKg);
    if (!form.startWeightKg || !form.goalWeightKg || !Number.isFinite(from) || !Number.isFinite(to)) {
      return null;
    }
    const delta = Math.round((to - from) * 10) / 10;
    return { delta, label: `${delta > 0 ? '+' : ''}${delta}` };
  }, [form.startWeightKg, form.goalWeightKg]);

  function validate(target: number): Errors {
    const found: Errors = {};

    if (target >= 1) {
      if (form.name.trim().length < 2) found.name = 'الاسم مطلوب';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        found.email = 'صيغة البريد الإلكتروني غير صحيحة';
      }
      if (form.password.length < 8) found.password = 'كلمة المرور يجب ألا تقل عن 8 أحرف';
      if (form.phone.trim() && !/^[+0-9\s()-]{7,20}$/.test(form.phone.trim())) {
        found.phone = 'رقم الهاتف غير صالح';
      }
    }

    if (target >= 2) {
      found.heightCm = rangeError(form.heightCm, 50, 260, 'الطول');
      found.age = rangeError(form.age, 10, 100, 'العمر');
      found.startWeightKg = rangeError(form.startWeightKg, 30, 300, 'الوزن الحالي');
    }

    if (target >= 3) {
      found.goalWeightKg = rangeError(form.goalWeightKg, 30, 300, 'هدف الوزن');
    }

    // Drop the keys that came back clean.
    return Object.fromEntries(Object.entries(found).filter(([, value]) => value)) as Errors;
  }

  function goNext(event: FormEvent) {
    event.preventDefault();

    const found = validate(step);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    void submit();
  }

  async function submit() {
    setSaving(true);
    setSubmitError(null);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };
    if (form.phone.trim()) body.phone = form.phone.trim();
    if (form.heightCm) body.heightCm = Number(form.heightCm);
    if (form.age) body.age = Number(form.age);
    if (form.startWeightKg) body.startWeightKg = Number(form.startWeightKg);
    if (form.startDate) body.startDate = form.startDate;
    if (form.goalWeightKg) body.goalWeightKg = Number(form.goalWeightKg);
    if (form.goalNote.trim()) body.goalNote = form.goalNote.trim();

    try {
      const client = await api.post<ClientProfile>('/clients', body);
      notify('تم إنشاء حساب المتدرب');
      router.push(`/trainer/clients/${client.id}`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setSubmitError(caught.fieldMessages[0] ?? caught.message);
        // A duplicate email is a step-1 problem — take them back to fix it.
        if (caught.status === 409) {
          setStep(1);
          setErrors({ email: caught.message });
        }
      } else {
        setSubmitError('تعذّر إنشاء الحساب');
      }
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <div>
        <Link
          href="/trainer"
          className="inline-block pb-2 text-[14px] font-semibold text-text-muted transition-colors hover:text-accent-pressed"
        >
          ← رجوع للمتدربين
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-[36px] font-bold">
          متدرب جديد
        </h1>
      </div>

      <WizardSteps labels={STEP_LABELS} current={step} />

      <form
        onSubmit={goNext}
        noValidate
        className="flex flex-col gap-5 rounded-[16px] bg-surface p-7 border border-line-soft"
      >
        <h2 className="font-[family-name:var(--font-display)] text-[24px] font-bold">
          {STEP_LABELS[step - 1]}
        </h2>

        {submitError && <ErrorNote message={submitError} />}

        {step === 1 && (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            <PillField
              label="الاسم الكامل"
              placeholder="مثال: فهد الحربي"
              autoComplete="off"
              value={form.name}
              error={errors.name}
              onChange={(e) => set('name', e.target.value)}
            />
            <PillField
              label="البريد الإلكتروني"
              type="email"
              latin
              placeholder="name@mail.com"
              autoComplete="off"
              value={form.email}
              error={errors.email}
              onChange={(e) => set('email', e.target.value)}
            />
            <div className="flex min-w-0 items-end gap-2">
              <PillField
                label="كلمة مرور مبدئية"
                latin
                className="flex-1"
                autoComplete="off"
                hint="لا يمكن تغييرها لاحقًا — احفظها وسلّمها للمتدرب."
                value={form.password}
                error={errors.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <GhostPill
                type="button"
                onClick={() => set('password', suggestPassword())}
                className="mb-[26px] shrink-0"
              >
                توليد
              </GhostPill>
            </div>
            <PillField
              label="رقم التواصل"
              type="tel"
              latin
              placeholder="05XXXXXXXX"
              autoComplete="off"
              value={form.phone}
              error={errors.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <PillField
              label="الطول (سم)"
              type="number"
              inputMode="numeric"
              placeholder="176"
              value={form.heightCm}
              error={errors.heightCm}
              onChange={(e) => set('heightCm', e.target.value)}
            />
            <PillField
              label="العمر"
              type="number"
              inputMode="numeric"
              placeholder="29"
              value={form.age}
              error={errors.age}
              onChange={(e) => set('age', e.target.value)}
            />
            <PillField
              label="الوزن الحالي (كجم)"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="92"
              value={form.startWeightKg}
              error={errors.startWeightKg}
              onChange={(e) => set('startWeightKg', e.target.value)}
            />
            <PillField
              label="تاريخ بداية البرنامج"
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-wrap items-end gap-4">
              <PillField
                label="هدف الوزن (كجم)"
                type="number"
                inputMode="decimal"
                step="0.1"
                size="lg"
                placeholder="82"
                className="min-w-[200px]"
                value={form.goalWeightKg}
                error={errors.goalWeightKg}
                onChange={(e) => set('goalWeightKg', e.target.value)}
              />

              {/* Live difference — the reason step 2 asks for current weight. */}
              {difference && (
                <div className="rounded-[14px] bg-lime-tint px-5 py-3.5">
                  <p className="text-[13px] font-semibold text-lime-strong">الفرق المطلوب</p>
                  <p className="font-[family-name:var(--font-display)] text-[26px] font-bold text-lime-ink">
                    <Num>{difference.label}</Num> كجم
                  </p>
                </div>
              )}
            </div>

            <PillTextArea
              label="ملاحظة الهدف"
              rows={4}
              placeholder="مثال: نزول دهون مع الحفاظ على الكتلة العضلية، جاهز لسفر بعد 3 شهور."
              value={form.goalNote}
              onChange={(e) => set('goalNote', e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {step === 1 ? (
            <Link
              href="/trainer"
              className="flex h-12 items-center rounded-full border border-line px-[22px] text-[15px] font-semibold transition-colors hover:bg-surface-alt"
            >
              السابق
            </Link>
          ) : (
            <GhostPill type="button" onClick={() => setStep(step - 1)} disabled={saving}>
              السابق
            </GhostPill>
          )}

          <PrimaryPill type="submit" disabled={saving}>
            {saving ? 'جارٍ الإنشاء…' : step === 3 ? 'إنشاء الحساب وإشعار المتدرب' : 'التالي'}
          </PrimaryPill>
        </div>
      </form>
    </div>
  );
}

/** Shared numeric-range check; returns undefined when the value is fine or blank. */
function rangeError(
  raw: string,
  min: number,
  max: number,
  label: string,
): string | undefined {
  if (!raw.trim()) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return `${label} يجب أن يكون رقمًا`;
  if (value < min || value > max) return `${label} يجب أن يكون بين ${min} و ${max}`;
  return undefined;
}
