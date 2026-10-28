import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updatePassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
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
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign In with Email & Password
 */
export async function signInEmail(email, password) {
  const cleanEmail = (email || '').trim();
  if (!cleanEmail || !password) throw new Error('Please enter both email and password.');
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  return await hydrateUserProfile(userCredential.user);
}

/**
 * Sign Up with Email, Password & Name
 */
export async function signUpEmail(name, email, password) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim();
  if (!cleanName) throw new Error('Please enter your full name.');
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) throw new Error('Please enter a valid email.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  // Initial cloud payload for macOS app sync
  const initialData = {
    proTier: 'none',
    verifiedUTRs: [],
    favorites: [],
    updatedAt: Date.now() / 1000
  };
  const photoPayload = btoa(JSON.stringify(initialData));

  await updateProfile(user, {
    displayName: cleanName,
    photoURL: photoPayload
  });

  // Save in Firestore and user registry
  try {
    const userDocData = {
      email: cleanEmail,
      displayName: cleanName,
      proTier: 'none',
      verifiedUTRs: [],
      hasPassword: true,
      createdAt: Date.now(),
      lastSeen: Date.now()
    };
    await setDoc(doc(db, 'users', user.uid), userDocData, { merge: true });
    await syncUserToRegistry({
      uid: user.uid,
      email: cleanEmail,
      displayName: cleanName,
      proTier: 'none',
      plan: 'Free Tier',
      status: 'Active',
      hasPassword: true
    });
  } catch (e) {
    console.warn('Firestore set warning:', e);
  }

  return await hydrateUserProfile(user);
}

/**
 * Sign In / Sign Up with Google OAuth
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if firestore doc exists
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // New Google user: initial cloud payload
    const initialData = {
      proTier: 'none',
      verifiedUTRs: [],
      favorites: [],
      updatedAt: Date.now() / 1000
    };
    const photoPayload = btoa(JSON.stringify(initialData));

    try {
      await updateProfile(user, { photoURL: photoPayload });
    } catch {}

    try {
      await setDoc(ref, {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        proTier: 'none',
        verifiedUTRs: [],
        hasPassword: false, // Flag so user knows to create desktop app password!
        createdAt: Date.now(),
        lastSeen: Date.now()
      }, { merge: true });
      await syncUserToRegistry({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        proTier: 'none',
        plan: 'Free Tier',
        status: 'Active',
        hasPassword: false
      });
    } catch (e) {
      console.warn('Firestore Google user set warning:', e);
    }
  }

  return await hydrateUserProfile(user);
}

/**
 * Set or Change Password (Allows Google sign-in users to create an app password)
 */
export async function setUserPassword(newPassword) {
  if (!auth.currentUser) throw new Error('Please sign in first.');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  await updatePassword(auth.currentUser, newPassword);

  // Update hasPassword flag in Firestore
  try {
    const ref = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(ref, { hasPassword: true });
  } catch {}

  return true;
}

/**
 * Update Profile Name
 */
export async function updateUserProfileName(newName) {
  if (!auth.currentUser) throw new Error('Please sign in first.');
  const clean = (newName || '').trim();
  if (!clean) throw new Error('Name cannot be empty.');

  await updateProfile(auth.currentUser, { displayName: clean });
  try {
    const ref = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(ref, { displayName: clean });
  } catch {}

  return await hydrateUserProfile(auth.currentUser);
}

/**
 * Upgrade User to Pro/Lifetime Tier (Synchronizes with Firestore & photoURL payload for macOS app)
 */
export async function upgradeToLifetimePro(utr = '') {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first to upgrade.');

  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};

  const existingUTRs = existing.verifiedUTRs || [];
  const updatedUTRs = utr.trim() ? Array.from(new Set([...existingUTRs, utr.trim()])) : existingUTRs;

  // 1. Update Firestore
  try {
    await setDoc(ref, {
      proTier: 'lifetime',
      verifiedUTRs: updatedUTRs,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore upgrade warning:', err);
  }

  // 2. Update Auth photoURL payload string (macOS app directly consumes this!)
  const cloudData = {
    proTier: 'lifetime',
    verifiedUTRs: updatedUTRs,
    favorites: existing.favorites || [],
    updatedAt: Date.now() / 1000
  };
  const payloadString = btoa(JSON.stringify(cloudData));

  try {
    await updateProfile(user, { photoURL: payloadString });
  } catch (err) {
    console.warn('Auth photoURL upgrade warning:', err);
  }

  return await hydrateUserProfile(user);
}

/**
 * Record a voluntary donation to support development and keep AuraLoop alive
 */
export async function recordDonation(amount = 0, orderId = '') {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to record your donation.');

  const cleanAmount = Number(amount) || 0;
  if (cleanAmount <= 0) throw new Error('Invalid donation amount.');

  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};

  const currentTotal = Number(existing.totalDonated || 0);
  const newTotal = currentTotal + cleanAmount;
  const history = existing.donations || [];
  history.push({
    orderId: orderId || `order_${Date.now()}`,
    amount: cleanAmount,
    timestamp: Date.now(),
  });

  // 1. Update Firestore
  try {
    await setDoc(ref, {
      totalDonated: newTotal,
      isSupporter: true,
      donations: history,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore donation update warning:', err);
  }

  // 2. Update Auth photoURL payload string for macOS app sync
  const existingPayload = user.photoURL ? (() => {
    try { return JSON.parse(atob(user.photoURL)); } catch { return {}; }
  })() : {};

  const cloudData = {
    ...existingPayload,
    totalDonated: newTotal,
    isSupporter: true,
    updatedAt: Date.now() / 1000,
  };

  try {
    const payloadString = btoa(JSON.stringify(cloudData));
    await updateProfile(user, { photoURL: payloadString });
  } catch (err) {
    console.warn('Auth photoURL donation warning:', err);
  }

  return await hydrateUserProfile(user);
}

/**
 * Helper to fetch complete user profile including Firestore & password provider status
 */
export async function hydrateUserProfile(user) {
  if (!user) return null;

  let firestoreData = {};
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) firestoreData = snap.data();
  } catch {}

  // Also query settings/users_registry for administrative flags (like free premium granted by admin)
  let registryUser = null;
  try {
    const regSnap = await getDoc(doc(db, 'settings', 'users_registry'));
    if (regSnap.exists()) {
      const reg = regSnap.data();
      registryUser = reg[user.uid] || (user.email ? Object.values(reg).find(u => u.email?.toLowerCase() === user.email.toLowerCase()) : null);
    }
  } catch (e) {}

  // Parse photoURL payload if available
  let cloudPayload = {};
  if (user.photoURL && user.photoURL.length > 10) {
    try {
      cloudPayload = JSON.parse(atob(user.photoURL));
    } catch {}
  }

  // Determine if user has a password provider linked
  const hasPasswordProvider = user.providerData?.some(p => p.providerId === 'password');
  const hasPassword = firestoreData.hasPassword ?? hasPasswordProvider ?? false;
  const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com');

  const isGiftedPro = Boolean(firestoreData.isGiftedPro || registryUser?.isGiftedPro || cloudPayload.isGiftedPro);
  const rawTier = firestoreData.proTier || registryUser?.proTier || cloudPayload.proTier || 'none';
  const proTier = isGiftedPro ? 'lifetime' : rawTier;

  const freePremiumNotifiedWeb = Boolean(firestoreData.freePremiumNotifiedWeb || registryUser?.freePremiumNotifiedWeb);
  const freePremiumNotifiedApp = Boolean(firestoreData.freePremiumNotifiedApp || registryUser?.freePremiumNotifiedApp);
  const totalDonated = Number(firestoreData.totalDonated || cloudPayload.totalDonated || 0);
  const isSupporter = Boolean(firestoreData.isSupporter || cloudPayload.isSupporter || totalDonated > 0);

  const profile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || firestoreData.displayName || registryUser?.name || user.email.split('@')[0],
    photoURL: user.photoURL,
    proTier,
    isGiftedPro,
    freePremiumNotifiedWeb,
    freePremiumNotifiedApp,
    verifiedUTRs: firestoreData.verifiedUTRs || cloudPayload.verifiedUTRs || [],
    hasPassword,
    isGoogleUser,
    totalDonated,
    isSupporter,
    donations: firestoreData.donations || []
  };

  // If user was gifted Pro in registry but Firestore doc or photoURL payload doesn't have it yet, write it back!
  if (isGiftedPro && (!firestoreData.isGiftedPro || firestoreData.proTier !== 'lifetime')) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        proTier: 'lifetime',
        isGiftedPro: true,
        updatedAt: Date.now() / 1000
      }, { merge: true });

      const updatedCloud = {
        ...cloudPayload,
        proTier: 'lifetime',
        isGiftedPro: true,
        updatedAt: Date.now() / 1000
      };
      await updateProfile(user, { photoURL: btoa(JSON.stringify(updatedCloud)) });
    } catch (e) {}
  }

  // Sync to users_registry so Admin always sees active users
  syncUserToRegistry(profile);

  return profile;
}

/**
 * Synchronize a user record to settings/users_registry in Firestore & local cache
 */
export async function syncUserToRegistry(userData) {
  if (!userData?.uid && !userData?.email) return;
  const uid = userData.uid || userData.id;

  const entry = {
    id: uid,
    name: userData.displayName || userData.name || userData.email.split('@')[0],
    email: userData.email,
    role: (userData.proTier === 'lifetime' || userData.isGiftedPro) ? 'Pro Member' : 'Free User',
    status: userData.status || 'Active',
    plan: (userData.proTier === 'lifetime' || userData.isGiftedPro) ? 'Pro Plan' : 'Free Tier',
    device: userData.device || 'macOS App Client',
    downloads: userData.favorites?.length || 0,
    lastSeen: new Date().toLocaleDateString(),
    avatar: (userData.displayName || userData.name || userData.email || 'U').slice(0, 2).toUpperCase(),
    joined: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    verified: Boolean(userData.proTier === 'lifetime' || userData.isGiftedPro),
    isGiftedPro: Boolean(userData.isGiftedPro),
    freePremiumNotifiedWeb: Boolean(userData.freePremiumNotifiedWeb),
    freePremiumNotifiedApp: Boolean(userData.freePremiumNotifiedApp),
    proTier: userData.proTier || (userData.isGiftedPro ? 'lifetime' : 'none'),
    hasPassword: Boolean(userData.hasPassword),
    updatedAt: Date.now() / 1000
  };

  // 1. Update Firestore settings/users_registry
  try {
    const regRef = doc(db, 'settings', 'users_registry');
    await setDoc(regRef, { [uid]: entry }, { merge: true });
  } catch (e) {
    console.warn('[firebase] User registry sync warning:', e);
  }

  // 2. Keep local cache up to date
  try {
    const local = localStorage.getItem('auraloop_real_users');
    let list = local ? JSON.parse(local) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex(u => u.id === uid || u.email?.toLowerCase() === entry.email?.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...entry };
    } else {
      list.push(entry);
    }
    localStorage.setItem('auraloop_real_users', JSON.stringify(list));
  } catch (e) {}
}

/**
 * Mark that the Free Premium Celebration Popup has been acknowledged by user
 */
export async function markFreePremiumNotifiedWeb(uid) {
  if (!uid) return;
  try {
    localStorage.setItem(`auraloop_gifted_pro_seen_${uid}`, 'true');
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { freePremiumNotifiedWeb: true, updatedAt: Date.now() / 1000 });
    const regRef = doc(db, 'settings', 'users_registry');
    await setDoc(regRef, { [uid]: { freePremiumNotifiedWeb: true } }, { merge: true });
  } catch (e) {
    console.warn('[firebase] Failed to mark notified:', e);
  }
}

export function subscribeAuth(callback) {
  return fbOnAuthStateChanged(auth, async user => {
    if (user) {
      const profile = await hydrateUserProfile(user);
      callback(profile);
    } else {
      callback(null);
    }
  });
}

export async function signOutUser() {
  await fbSignOut(auth);
}
