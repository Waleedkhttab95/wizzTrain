'use client';

import { ApiRoutes } from '@wizzapp/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { suggestPassword } from '@/lib/password';

/**
 * Issues a client a replacement password when they have lost theirs.
 *
 * There is no email on file to send a reset link to, so this works the same
 * way account creation does: the trainer gets a value, reads it out, and it
 * is never shown again. The dialog keeps the new password on screen until
 * the trainer dismisses it, because nothing else can recover it afterwards.
 */
export function ResetClientPasswordDialog({
  open,
  clientId,
  clientName,
  onClose,
}: {
  open: boolean;
  clientId: string;
  clientName: string;
  onClose: () => void;
}) {
  const { notify } = useToast();

  const [password, setPassword] = useState('');
  const [issued, setIssued] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword(suggestPassword());
    setIssued(false);
    setError(null);
    setSaving(false);
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.trim().length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 أحرف');
      return;
    }

    setSaving(true);
    try {
      await api.post<void>(ApiRoutes.clients.password(clientId), { password: password.trim() });
      // Deliberately not closing: this is the only time the value is visible.
      setIssued(true);
      notify('تم تعيين كلمة مرور جديدة');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذّر تعيين كلمة المرور');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`كلمة مرور جديدة لـ ${clientName}`}>
      {issued ? (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] leading-relaxed text-text-muted">
            سلّم هذه الكلمة للمتدرب الآن. لن تظهر مرة أخرى بعد إغلاق هذه النافذة.
          </p>
          <p
            dir="ltr"
            className="rounded-[12px] border border-line bg-surface-alt px-4 py-3.5 text-center font-[family-name:var(--font-num)] text-[22px] font-bold tracking-wide"
          >
            {password}
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="blaze" onClick={onClose}>
              سلّمتها
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <p className="text-[14px] leading-relaxed text-text-muted">
            كلمة المرور الحالية لن تعمل بعد الحفظ. جلسات المتدرب المفتوحة تبقى شغّالة حتى تنتهي
            صلاحيتها.
          </p>

          <div className="flex items-end gap-2.5">
            <div className="flex-1">
              <Field
                label="كلمة المرور الجديدة"
                autoComplete="off"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="button" variant="solid" onClick={() => setPassword(suggestPassword())}>
              توليد
            </Button>
          </div>

          {error && <ErrorNote message={error} />}

          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" variant="blaze" loading={saving}>
              تعيين
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
