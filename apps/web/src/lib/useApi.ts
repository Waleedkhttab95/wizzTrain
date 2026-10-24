'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

interface Result<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
  /** Replace the loaded value without a round trip, after a successful write. */
  set: (value: T) => void;
}

/**
 * Loads one resource and keeps its loading and error state. 404 is surfaced as
 * an `ApiError` rather than thrown away, because on the `/active` routes it
 * means "the trainer hasn't set this up yet" — an empty state, not a failure.
 */
export function useApi<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[]): Result<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // `load` is redefined on every render by callers; the dependency list they
  // pass is the real trigger.
  const run = useCallback(load, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    run(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(caught instanceof ApiError ? caught : new ApiError(0, 'حدث خطأ غير متوقع'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [run, nonce]);

  return {
    data,
    error,
    loading,
    reload: useCallback(() => setNonce((n) => n + 1), []),
    set: useCallback((value: T) => setData(value), []),
  };
}
