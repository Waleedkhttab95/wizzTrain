'use client';

import { VIDEO_UPLOAD, type ExerciseVideo } from '@wizzapp/shared';
import { useRef, useState } from 'react';
import { Num } from '@/components/ui/Num';
import { cn } from '@/components/ui/cn';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';

const MAX_MB = Math.round(VIDEO_UPLOAD.maxBytes / (1024 * 1024));

/**
 * Attaches a demonstration video to an exercise — a pasted link or an uploaded
 * file, never both.
 *
 * Unlike the rest of the builder this does **not** go through the draft: an
 * upload is a real side effect on the server, so it saves immediately and the
 * parent is told to reload. Holding a File in draft state until "حفظ البرنامج"
 * would mean losing it on any navigation.
 */
export function ExerciseVideoField({
  exerciseId,
  video,
  onChanged,
}: {
  /** Null for a row that hasn't been saved yet — video needs an id to attach to. */
  exerciseId: string | null;
  video: ExerciseVideo | null;
  onChanged: () => void;
}) {
  const { notify } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'link' | 'upload'>(video?.kind ?? 'link');
  const [link, setLink] = useState(video?.kind === 'link' ? video.url : '');
  const [busy, setBusy] = useState(false);

  if (!exerciseId) {
    return (
      <p className="text-[12px] text-text-faint">
        احفظ البرنامج أولاً عشان تقدر تضيف فيديو لهذا التمرين.
      </p>
    );
  }

  async function saveLink() {
    setBusy(true);
    try {
      await api.patch(`/exercises/${exerciseId}`, { videoUrl: link.trim() });
      notify(link.trim() ? 'تم حفظ رابط الفيديو' : 'تم حذف الفيديو');
      setOpen(false);
      onChanged();
    } catch (caught) {
      notify(
        caught instanceof ApiError ? (caught.fieldMessages[0] ?? caught.message) : 'تعذّر الحفظ',
        'bad',
      );
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    if (file.size > VIDEO_UPLOAD.maxBytes) {
      notify(`حجم الفيديو يجب ألا يتجاوز ${MAX_MB} ميجابايت`, 'bad');
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append('video', file);
      // FormData must not carry a JSON content-type, so this bypasses the
      // shared client and sets only the Authorization header.
      await api.upload(`/exercises/${exerciseId}/video`, form);
      notify('تم رفع الفيديو');
      setOpen(false);
      onChanged();
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر رفع الفيديو', 'bad');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function detach() {
    setBusy(true);
    try {
      await api.del(`/exercises/${exerciseId}/video`);
      setLink('');
      notify('تم حذف الفيديو');
      onChanged();
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر الحذف', 'bad');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {video ? (
          <>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1.5 text-[12.5px] font-semibold text-accent-tint-ink transition-colors hover:bg-accent-tint-2"
            >
              <PlayIcon />
              {video.kind === 'upload' ? 'فيديو مرفوع' : 'رابط فيديو'}
            </a>
            <button
              onClick={() => setOpen(true)}
              className="rounded-full px-2 py-1.5 text-[12.5px] font-semibold text-text-muted transition-colors hover:text-text"
            >
              تغيير
            </button>
            <button
              onClick={detach}
              disabled={busy}
              className="rounded-full px-2 py-1.5 text-[12.5px] font-semibold text-text-faint transition-colors hover:text-accent-pressed disabled:opacity-50"
            >
              حذف
            </button>
          </>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-border-dashed px-3 py-1.5 text-[12.5px] font-semibold text-text-muted transition-colors hover:bg-accent-tint hover:text-accent-pressed"
          >
            <PlayIcon />+ فيديو الشرح
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[12px] bg-surface-alt p-3">
      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label="نوع الفيديو" className="flex gap-1 rounded-full bg-bg p-1">
          {(['link', 'upload'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                mode === option ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text',
              )}
            >
              {option === 'link' ? 'رابط' : 'رفع'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="إغلاق"
          className="grid size-7 place-items-center rounded-full text-text-faint transition-colors hover:bg-surface hover:text-text"
        >
          ✕
        </button>
      </div>

      {mode === 'link' ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            dir="ltr"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            aria-label="رابط الفيديو"
            className="h-10 min-w-0 flex-1 rounded-full border border-border bg-input-bg px-3.5 text-start text-[13.5px] transition-colors placeholder:text-placeholder focus:border-accent focus:outline-none"
          />
          <button
            onClick={saveLink}
            disabled={busy}
            className="h-10 shrink-0 rounded-full bg-accent px-4 text-[13.5px] font-bold text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? '…' : 'حفظ'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <input
            ref={fileInput}
            type="file"
            accept={VIDEO_UPLOAD.mimeTypes.join(',')}
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
            className="text-[12.5px] text-text-muted file:me-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-accent-ink hover:file:bg-accent-hover"
          />
          <p className="text-[11.5px] text-text-faint">
            MP4 أو MOV أو WebM · الحد الأقصى <Num>{MAX_MB}</Num> ميجابايت
            {busy && ' · جارٍ الرفع…'}
          </p>
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5 16 12l-6 3.5z" />
    </svg>
  );
}
