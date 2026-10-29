// AuraLoop Real Firebase Auth & Firestore Service
// Connects to Firebase Project "auraloop-5358f" for 100% Real User Management

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCxqpRdX1n47PK3TuPlvm8R-7iyylTvUb8',
  authDomain: 'auraloop-5358f.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'auraloop-5358f',
  storageBucket: 'auraloop-5358f.appspot.com',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Real Admin User Profile
export const REAL_ADMIN_USER = {
  id: 'ADMIN_AVDESH',
  name: 'Avdesh Jadon',
  email: 'theavdeshjadon@gmail.com',
  role: 'Super Admin & Creator',
  status: 'Active',
  plan: 'Super Admin',
  device: 'MacBook Pro (Apple Silicon M-Series, macOS 15.3 Sequoia)',
  downloads: 785,
  lastSeen: 'Online Now',
  avatar: 'AJ',
  joined: 'Jan 2025',
  verified: true,
  isGiftedPro: false,
};

// Known verified account seed (matches user screenshot)
const KNOWN_ACCOUNTS = [
  {
    id: 'USR_LAVENDER_01',
    name: 'avdesh jadon',
    email: 'thelavendershub@gmail.com',
    role: 'Free User',
    status: 'Active',
    plan: 'Free Tier',
    device: 'MacBook Pro (macOS Sequoia)',
    downloads: 12,
    lastSeen: 'Active Today',
    avatar: 'AJ',
    joined: 'Oct 2026',
    verified: false,
    isGiftedPro: false,
    freePremiumNotifiedWeb: false,
    freePremiumNotifiedApp: false,
  }
];

/**
 * Fetch all real users from Firestore and User Registry
 * Merges Firestore collection, shared registry document, and local cache.
 */
export async function fetchRealFirestoreUsers() {
  const userMap = new Map();

  const deletedEmails = (() => {
    try {
      return JSON.parse(localStorage.getItem('auraloop_deleted_users') || '[]');
    } catch {
      return [];
    }
  })();

  // 1. Always put Super Admin first
  userMap.set(REAL_ADMIN_USER.email.toLowerCase(), { ...REAL_ADMIN_USER });

  // 2. Add known seed accounts if not deleted
  KNOWN_ACCOUNTS.forEach((seed) => {
    const emailLower = seed.email.toLowerCase();
    if (!deletedEmails.includes(emailLower)) {
      userMap.set(emailLower, { ...seed });
    }
  });

  // 3. Load authoritative entitlements from Cloudflare R2 / CDN
  try {
    const cdnRes = await fetch(`https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/user_entitlements.json?t=${Date.now()}`, { cache: 'no-store' });
    if (cdnRes.ok) {
      const entitlements = await cdnRes.json();
      Object.entries(entitlements).forEach(([emailKey, data]) => {
        const emailLower = emailKey.toLowerCase();
        if (data.isDeleted || deletedEmails.includes(emailLower)) {
          userMap.delete(emailLower);
          return;
        }

        const existing = userMap.get(emailLower) || {};
        const isGifted = Boolean(data.isGiftedPro);
        const isPro = data.proTier === 'lifetime' || data.proTier === 'pro' || isGifted;

        userMap.set(emailLower, {
          ...existing,
          email: emailLower,
          name: existing.name || emailLower.split('@')[0],
          status: data.isSuspended ? 'Suspended' : (existing.status || 'Active'),
          isSuspended: Boolean(data.isSuspended),
          plan: emailLower === REAL_ADMIN_USER.email.toLowerCase()
            ? 'Super Admin'
            : (isPro ? 'Pro Plan' : 'Free Tier'),
          role: emailLower === REAL_ADMIN_USER.email.toLowerCase()
            ? 'Super Admin & Creator'
            : (isPro ? 'Pro Member' : 'Free User'),
          proTier: isGifted ? 'lifetime' : (data.proTier || 'none'),
          isGiftedPro: isGifted,
          verified: isPro,
          device: existing.device || 'macOS App Client',
          downloads: existing.downloads ?? 12,
          lastSeen: existing.lastSeen || 'Active Today',
          avatar: (existing.name || emailLower).slice(0, 2).toUpperCase(),
          joined: existing.joined || '2026',
        });
      });
    }
  } catch (err) {
    console.info('[firebaseAuthService] CDN entitlements fetch notice:', err?.message);
  }

  // 4. Load from Firestore settings/users_registry (guaranteed shared document)
  try {
    const regSnap = await getDoc(doc(db, 'settings', 'users_registry'));
    if (regSnap.exists()) {
      const regData = regSnap.data();
      Object.entries(regData).forEach(([key, val]) => {
        if (val && typeof val === 'object' && val.email) {
          const emailLower = val.email.toLowerCase();
          if (val.isDeleted || deletedEmails.includes(emailLower)) {
            userMap.delete(emailLower);
            return;
          }
          const existing = userMap.get(emailLower) || {};
          const isGifted = Boolean(val.isGiftedPro || existing.isGiftedPro);
          const isPro = val.proTier === 'lifetime' || isGifted || val.plan === 'Pro Plan';

          userMap.set(emailLower, {
            ...existing,
            ...val,
            id: val.id || existing.id || key,
            name: val.name || val.displayName || existing.name || val.email.split('@')[0],
            email: val.email,
            status: val.status || existing.status || 'Active',
            isSuspended: val.status === 'Suspended' || val.isSuspended === true,
            plan: emailLower === REAL_ADMIN_USER.email.toLowerCase()
              ? 'Super Admin'
              : (isPro ? 'Pro Plan' : 'Free Tier'),
            role: emailLower === REAL_ADMIN_USER.email.toLowerCase()
              ? 'Super Admin & Creator'
              : (isPro ? 'Pro Member' : 'Free User'),
            isGiftedPro: isGifted,
            freePremiumNotifiedWeb: Boolean(val.freePremiumNotifiedWeb),
            freePremiumNotifiedApp: Boolean(val.freePremiumNotifiedApp),
            device: val.device || existing.device || 'macOS App Client',
            downloads: val.downloads ?? existing.downloads ?? 0,
            lastSeen: val.lastSeen || existing.lastSeen || 'Active Today',
            avatar: (val.name || val.displayName || val.email || 'U').slice(0, 2).toUpperCase(),
            joined: val.joined || existing.joined || '2026',
            verified: isPro,
          });
        }
      });
    }
  } catch (err) {
    console.info('[firebaseAuthService] users_registry fetch notice:', err.message);
  }

  // 4. Try Firestore collection('users') if permission allows
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap && !snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && d.email) {
          const emailLower = d.email.toLowerCase();
          if (d.isDeleted || deletedEmails.includes(emailLower)) {
            userMap.delete(emailLower);
            return;
          }
          const existing = userMap.get(emailLower) || {};
          const isGifted = Boolean(d.isGiftedPro || existing.isGiftedPro);
          const isPro = d.proTier === 'lifetime' || isGifted || d.proTier === 'pro';

          userMap.set(emailLower, {
            ...existing,
            ...d,
            id: docSnap.id,
            name: d.displayName || d.name || existing.name || d.email.split('@')[0],
            email: d.email,
            status: d.status || existing.status || 'Active',
            isSuspended: d.status === 'Suspended' || d.isSuspended === true,
            plan: emailLower === REAL_ADMIN_USER.email.toLowerCase()
              ? 'Super Admin'
              : (isPro ? 'Pro Plan' : 'Free Tier'),
            role: emailLower === REAL_ADMIN_USER.email.toLowerCase()
              ? 'Super Admin & Creator'
              : (isPro ? 'Pro Member' : 'Free User'),
            isGiftedPro: isGifted,
            freePremiumNotifiedWeb: Boolean(d.freePremiumNotifiedWeb),
            freePremiumNotifiedApp: Boolean(d.freePremiumNotifiedApp),
            device: d.device || existing.device || 'macOS App Client',
            downloads: d.favorites?.length ?? existing.downloads ?? 0,
            lastSeen: d.updatedAt ? new Date(d.updatedAt * 1000).toLocaleDateString() : (existing.lastSeen || 'Active Today'),
            avatar: (d.displayName || d.email || 'U').slice(0, 2).toUpperCase(),
            joined: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : (existing.joined || '2026'),
            verified: isPro,
          });
        }
      });
    }
  } catch (err) {
    console.info('[firebaseAuthService] users collection query notice:', err.message);
  }

  // 5. Load and merge local cache additions
  try {
    const local = localStorage.getItem('auraloop_real_users');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item?.email) {
            const emailLower = item.email.toLowerCase();
            if (item.isDeleted || deletedEmails.includes(emailLower)) {
              userMap.delete(emailLower);
              return;
            }
            const existing = userMap.get(emailLower) || {};
            userMap.set(emailLower, { ...existing, ...item });
          }
        });
      }
    }
  } catch {}

  const mergedUsers = Array.from(userMap.values());
  saveRealUsers(mergedUsers);
  return mergedUsers;
}

/**
 * Synchronize user entitlement changes with Cloudflare R2 (universal propagation to Web & macOS)
 */
async function syncEntitlementToCloud(email, entitlement) {
  if (!email) return;
  try {
    const res = await fetch('/api/admin/entitlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...entitlement })
    });
    if (res.ok) {
      console.info('[firebaseAuthService] Synced entitlement to Cloudflare R2 via API:', email);
      return;
    }
  } catch (err) {
    console.warn('[firebaseAuthService] API sync notice, attempting direct Cloudflare PUT:', err?.message);
  }

  // Fallback: Direct Cloudflare R2 API call
  try {
    const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    const bucket = import.meta.env.VITE_AURALOOP_R2_BUCKET || 'auraloop-wallpapers';
    const token = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;
    if (!accountId || !token) return;

    const cdnBase = import.meta.env.VITE_CDN_BASE_URL || 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev';
    const cdnUrl = `${cdnBase}/user_entitlements.json?t=${Date.now()}`;

    let current = {};
    try {
      const getRes = await fetch(cdnUrl, { cache: 'no-store' });
      if (getRes.ok) current = await getRes.json();
    } catch {}

    const emailLower = email.toLowerCase();
    current[emailLower] = {
      ...(current[emailLower] || {}),
      email: emailLower,
      ...entitlement,
      updatedAt: Date.now()
    };

    await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/user_entitlements.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(current, null, 2)
    });
  } catch (e) {
    console.warn('[firebaseAuthService] Direct Cloudflare PUT notice:', e?.message);
  }
}

/**
 * Grant Free Lifetime Pro to any user from Admin Panel without payment.
 * Automatically synchronizes with Cloudflare R2, Firestore documents and registry.
 */
export async function adminGrantFreePremium(user) {
  if (!user || user.email === REAL_ADMIN_USER.email) return;

  const updatedUser = {
    ...user,
    plan: 'Pro Plan',
    role: 'Pro Member',
    proTier: 'lifetime',
    isGiftedPro: true,
    freePremiumNotifiedWeb: false,
    freePremiumNotifiedApp: false,
    giftedAt: Date.now(),
    updatedAt: Date.now() / 1000,
    verified: true,
  };

  // 1. Synchronize with authoritative Cloudflare R2 entitlements
  await syncEntitlementToCloud(user.email, {
    proTier: 'lifetime',
    isGiftedPro: true,
  });

  // 2. Update Firestore settings/users_registry
  try {
    const regRef = doc(db, 'settings', 'users_registry');
    await setDoc(regRef, {
      [user.id || user.email.replace(/[@.]/g, '_')]: updatedUser
    }, { merge: true });
  } catch (e) {
    console.warn('[firebaseAuthService] Failed to update registry on grant:', e);
  }

  // 3. Update user's direct Firestore doc if id is valid
  if (user.id && !user.id.startsWith('USR_LAVENDER') && !user.id.startsWith('ADMIN_')) {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        proTier: 'lifetime',
        isGiftedPro: true,
        freePremiumNotifiedWeb: false,
        freePremiumNotifiedApp: false,
        giftedAt: Date.now(),
        updatedAt: Date.now() / 1000,
      }, { merge: true });
    } catch (e) {
      console.warn('[firebaseAuthService] Direct userDoc grant update notice:', e);
    }
  }

  // 4. Update local cache
  try {
    const local = localStorage.getItem('auraloop_real_users');
    let list = local ? JSON.parse(local) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex((u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
    if (idx >= 0) {
      list[idx] = updatedUser;
    } else {
      list.push(updatedUser);
    }
    localStorage.setItem('auraloop_real_users', JSON.stringify(list));
  } catch {}

  return updatedUser;
}

/**
 * Revoke Pro and switch back to Free Tier (Downgrade)
 */
export async function adminRevokePro(user) {
  if (!user || user.email === REAL_ADMIN_USER.email) return;

  const updatedUser = {
    ...user,
    plan: 'Free Tier',
    role: 'Free User',
    proTier: 'none',
    isGiftedPro: false,
    updatedAt: Date.now() / 1000,
    verified: false,
  };

  // 1. Synchronize downgrade with authoritative Cloudflare R2 entitlements
  await syncEntitlementToCloud(user.email, {
    proTier: 'none',
    isGiftedPro: false,
  });

  // 2. Update Firestore settings/users_registry
  try {
    const regRef = doc(db, 'settings', 'users_registry');
    await setDoc(regRef, {
      [user.id || user.email.replace(/[@.]/g, '_')]: updatedUser
    }, { merge: true });
  } catch (e) {}

  // 3. Update user's direct Firestore doc if id is valid
  if (user.id && !user.id.startsWith('USR_LAVENDER') && !user.id.startsWith('ADMIN_')) {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        proTier: 'none',
        isGiftedPro: false,
        updatedAt: Date.now() / 1000,
      }, { merge: true });
    } catch (e) {}
  }

  // 4. Update local cache
  try {
    const local = localStorage.getItem('auraloop_real_users');
    let list = local ? JSON.parse(local) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex((u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
    if (idx >= 0) list[idx] = updatedUser;
    localStorage.setItem('auraloop_real_users', JSON.stringify(list));
  } catch {}

  return updatedUser;
}

/**
 * Toggle user account status (Active / Suspended)
 */
export async function adminToggleUserStatus(user) {
  if (!user || user.email === REAL_ADMIN_USER.email) return;

  const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
  const isSuspended = nextStatus === 'Suspended';

  const updatedUser = {
    ...user,
    status: nextStatus,
    isSuspended,
    updatedAt: Date.now() / 1000,
  };

  // 1. Synchronize suspension with Cloudflare R2
  await syncEntitlementToCloud(user.email, {
    isSuspended,
  });

  try {
    const regRef = doc(db, 'settings', 'users_registry');
    await setDoc(regRef, {
      [user.id || user.email.replace(/[@.]/g, '_')]: updatedUser
    }, { merge: true });
  } catch (e) {}

  if (user.id && !user.id.startsWith('USR_LAVENDER') && !user.id.startsWith('ADMIN_')) {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        status: nextStatus,
        isSuspended,
        updatedAt: Date.now() / 1000,
      }, { merge: true });
    } catch (e) {}
  }

  try {
    const local = localStorage.getItem('auraloop_real_users');
    let list = local ? JSON.parse(local) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex((u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
    if (idx >= 0) list[idx] = updatedUser;
    localStorage.setItem('auraloop_real_users', JSON.stringify(list));
  } catch {}

  return updatedUser;
}

/**
 * Subscribe to real-time user registry updates
 */
export function subscribeRealUsers(callback) {
  try {
    const regRef = doc(db, 'settings', 'users_registry');
    return onSnapshot(
      regRef,
      async () => {
        const fresh = await fetchRealFirestoreUsers();
        callback(fresh);
      },
      (err) => {
        console.info('[firebaseAuthService] Live registry listener notice:', err.message);
      }
    );
  } catch (e) {
    return () => {};
  }
}

export function saveRealUsers(users) {
  try {
    localStorage.setItem('auraloop_real_users', JSON.stringify(users));
  } catch {}
}

/**
 * Permanently delete a user from Firestore, Cloudflare R2 entitlements, and local registry
 */
export async function adminDeleteUser(user) {
  if (!user || user.email === REAL_ADMIN_USER.email) {
    throw new Error('Super Admin account cannot be deleted.');
  }

  const emailLower = user.email.toLowerCase();

  // 1. Record in local deleted set so they never reload
  try {
    const list = JSON.parse(localStorage.getItem('auraloop_deleted_users') || '[]');
    if (!list.includes(emailLower)) {
      list.push(emailLower);
      localStorage.setItem('auraloop_deleted_users', JSON.stringify(list));
    }
  } catch {}

  // 2. Synchronize deletion with Cloudflare R2 entitlements
  await syncEntitlementToCloud(emailLower, {
    deleteUser: true,
    isDeleted: true,
    status: 'Deleted',
    proTier: 'none',
    isGiftedPro: false,
  });

  // 3. Delete user document from Firestore collection('users')
  if (user.id && !user.id.startsWith('USR_LAVENDER') && !user.id.startsWith('ADMIN_')) {
    try {
      await deleteDoc(doc(db, 'users', user.id));
    } catch (e) {
      console.warn('[firebaseAuthService] Firestore deleteDoc notice:', e);
    }
  }

  // 4. Remove from Firestore settings/users_registry
  try {
    const regRef = doc(db, 'settings', 'users_registry');
    const snap = await getDoc(regRef);
    if (snap.exists()) {
      const data = snap.data();
      const updated = { ...data };
      delete updated[user.id];
      delete updated[emailLower.replace(/[@.]/g, '_')];
      await setDoc(regRef, updated);
    }
  } catch (e) {}

  // 5. Remove from local cache
  try {
    const local = localStorage.getItem('auraloop_real_users');
    let list = local ? JSON.parse(local) : [];
    if (Array.isArray(list)) {
      list = list.filter((u) => u.id !== user.id && u.email?.toLowerCase() !== emailLower);
      localStorage.setItem('auraloop_real_users', JSON.stringify(list));
    }
  } catch {}

  // 6. Remove from KNOWN_ACCOUNTS in memory
  const kIdx = KNOWN_ACCOUNTS.findIndex(k => k.email.toLowerCase() === emailLower);
  if (kIdx >= 0) {
    KNOWN_ACCOUNTS.splice(kIdx, 1);
  }

  return true;
}

export async function adminSignIn(email, password) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

export async function adminSignOut() {
  await fbSignOut(auth);
}
