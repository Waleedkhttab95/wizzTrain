'use client';

import { ApiRoutes } from '@wizzapp/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, api } from '@/lib/api';
import { Button } from './Button';
import { Field } from './Field';
import { ErrorNote } from './Feedback';
import { Modal } from './Modal';
import { useToast } from './Toast';

/**
 * Lets whoever is signed in change their own password. Shared by both roles:
 * the trainer reaches it from the sidebar, the client from their home screen.
 *
 * The API also wants the current password, not just the bearer token, so the
 * form asks for all three fields rather than two.
 */
export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notify } = useToast();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reopening should not show what was typed last time.
  useEffect(() => {
    if (!open) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    setSaving(false);
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (next.length < 8) {
      setError('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف');
      return;
    }
    // Caught here rather than at the API, which never sees this field.
    if (next !== confirm) {
      setError('التأكيد لا يطابق كلمة المرور الجديدة');
      return;
    }

    setSaving(true);
    try {
      await api.post<void>(ApiRoutes.auth.password, {
        currentPassword: current,
        newPassword: next,
      });
      notify('تم تغيير كلمة المرور');
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذّر تغيير كلمة المرور');
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="تغيير كلمة المرور">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="كلمة المرور الحالية"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <Field
          label="كلمة المرور الجديدة"
          type="password"
          autoComplete="new-password"
          hint="ثمانية أحرف على الأقل"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <Field
          label="تأكيد كلمة المرور الجديدة"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && <ErrorNote message={error} />}

        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button type="submit" variant="blaze" loading={saving}>
            حفظ
          </Button>
        </div>
      </form>
    </Modal>
  );
}
