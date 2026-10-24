'use client';

import { useEffect } from 'react';

/**
 * Reveals each `[data-reveal]` block as it enters the viewport.
 *
 * No animation library: the transition itself lives in the stylesheet and
 * this only flips the attribute from "hidden" to "shown". A <noscript> rule
 * in the markup covers the case where scripting is off entirely.
 */
export function LandingMotion() {
  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal="hidden"]'),
    );
    const show = (el: HTMLElement) => {
      el.dataset.reveal = 'shown';
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      blocks.forEach(show);
      return;
    }

    // Anything already on screen appears immediately; the rest wait for the
    // scroll. Staggering is per-section so a row of cards arrives in order.
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, index) => {
            const el = entry.target as HTMLElement;
            el.style.transitionDelay = `${index * 80}ms`;
            show(el);
            observer.unobserve(el);
          });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    blocks.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
