import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../../shared/gsap.js';
import { unsplash } from '../../shared/img.js';

/** Square, face-cropped Unsplash avatar at 1x / 2x. */
export function face(id, size) {
  const at = s => unsplash(id, { w: s, h: s, crop: 'faces', q: 70 });
  return { src: at(size * 2), srcSet: `${at(size)} 1x, ${at(size * 2)} 2x` };
}

/** Subscribes to a media query. */
export function useMedia(query, initial = false) {
  const [match, setMatch] = useState(() =>
    typeof window === 'undefined' ? initial : window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/**
 * Every waitlist call to action: scroll to the form, focus the email field and briefly
 * highlight the form. Works the same on mobile.
 */
export const LATEST_DMG_URL = 'https://github.com/avdeshjadon/AuraLoop/releases/latest/download/AuraLoop.dmg';

export function goToWaitlist(event) {
  event?.preventDefault?.();
  // Directly trigger immediate DMG download without opening GitHub release page
  window.location.href = LATEST_DMG_URL;
}

export const isMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Short time for a message header: drops the year. */
export const shortAt = at => at.replace(' 2026', '');
