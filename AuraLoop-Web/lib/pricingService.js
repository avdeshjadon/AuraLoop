import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export const DEFAULT_PRICING = {
  price: 199,
  originalPrice: 499,
  currency: '₹',
  planTitle: 'AuraLoop Lifetime Pro',
  description: 'Unlock 1,582+ 4K live wallpapers & audio sync across macOS & Web forever.',
};

const STORAGE_KEY = 'auraloop_pricing_config';
const EVENT_NAME = 'auraloop_pricing_updated';

/**
 * Retrieve the current cached pricing config synchronously
 */
export function getPricingConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.price === 'number') {
        return { ...DEFAULT_PRICING, ...parsed };
      }
    }
  } catch (err) {
    console.warn('[pricingService] Failed to read cached pricing:', err);
  }
  return { ...DEFAULT_PRICING };
}

/**
 * Save pricing config to localStorage and Firestore, broadcasting to all listeners in real-time
 */
export async function savePricingConfig(newConfig) {
  const merged = {
    ...DEFAULT_PRICING,
    ...getPricingConfig(),
    ...newConfig,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to local storage for instant access
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('[pricingService] Failed to write localStorage:', err);
  }

  // 2. Dispatch custom in-memory event for current tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
  }

  // 3. Persist to Firestore for multi-device / real-time cloud sync
  try {
    if (db) {
      const pricingRef = doc(db, 'settings', 'pricing');
      await setDoc(pricingRef, merged, { merge: true });
    }
  } catch (err) {
    console.warn('[pricingService] Firestore sync skipped or failed:', err?.message || err);
  }

  return merged;
}

/**
 * Subscribe to pricing updates (via Firestore real-time snapshot + local events)
 */
export function subscribePricing(callback) {
  callback(getPricingConfig());

  const handleLocalEvent = (e) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch (err) {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handleLocalEvent);
    window.addEventListener('storage', handleStorage);
  }

  let unsubscribeFirestore = () => {};
  try {
    if (db) {
      const pricingRef = doc(db, 'settings', 'pricing');
      unsubscribeFirestore = onSnapshot(
        pricingRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const merged = { ...DEFAULT_PRICING, ...data };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {}
            callback(merged);
          }
        },
        (err) => {
          console.warn('[pricingService] Firestore listener notice:', err?.message);
        }
      );
    }
  } catch (err) {
    console.warn('[pricingService] Firestore subscription notice:', err?.message);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_NAME, handleLocalEvent);
      window.removeEventListener('storage', handleStorage);
    }
    unsubscribeFirestore();
  };
}

/**
 * React hook to consume real-time pricing anywhere in the application
 */
export function usePricing() {
  const [pricing, setPricing] = useState(getPricingConfig);

  useEffect(() => {
    const unsubscribe = subscribePricing(setPricing);
    return () => unsubscribe();
  }, []);

  return pricing;
}
