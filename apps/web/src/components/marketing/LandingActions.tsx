'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { homeFor, useAuth } from '@/lib/auth';
import styles from './landing.module.css';

/**
 * Every call to action on the landing page points at the same two places:
 * the login screen for a visitor, their own dashboard for someone already
 * signed in. While the session is still being restored we show the visitor
 * version — that is the common case, and it never sends anyone somewhere
 * they cannot go.
 */
export function AuthLink({
  className,
  label,
  signedInLabel,
  children,
}: {
  className?: string;
  label: string;
  signedInLabel?: string;
  children?: ReactNode;
}) {
  const { user, loading } = useAuth();
  const signedIn = !loading && user !== null;

  return (
    <Link href={signedIn ? homeFor(user.role) : '/login'} className={className}>
      {signedIn ? (signedInLabel ?? label) : label}
      {children}
    </Link>
  );
}

/** Nav pair: a quiet sign-in link beside the primary button. */
export function NavActions() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return (
      <Link
        href={homeFor(user.role)}
        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
      >
        افتح لوحتي
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className={styles.navLink}>
        تسجيل دخول
      </Link>
      <Link href="/login" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
        ابدأ مجانًا
      </Link>
    </>
  );
}
