/**
 * AuraLoop Web Firebase Auth & Cloud Sync Service
 * Seamlessly synchronized with macOS AuraLoopApp via Firebase Auth REST & Firestore
 */

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCxqpRdX1n47PK3TuPlvm8R-7iyylTvUb8';
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'auraloop-5358f';
const STORAGE_KEY = 'auraloop_web_user';

let authListeners = [];

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function notifyListeners(user) {
  authListeners.forEach(cb => {
    try { cb(user); } catch (e) { console.error(e); }
  });
}

export function onAuthStateChanged(cb) {
  authListeners.push(cb);
  cb(getStoredUser());
  return () => {
    authListeners = authListeners.filter(l => l !== cb);
  };
}

export function saveUserSession(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
  notifyListeners(user);
}

export function signOut() {
  saveUserSession(null);
}

/**
 * Sign In with Email & Password
 */
export async function signIn(email, password) {
  const cleanEmail = email.trim();
  if (!cleanEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      password,
      returnSecureToken: true
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(mapAuthError(data?.error?.message || 'Failed to sign in'));
  }

  const uid = data.localId;
  const idToken = data.idToken;
  const displayName = data.displayName || cleanEmail.split('@')[0];

  // Decode Cloud Metadata from photoUrl or Firestore
  let cloudData = null;
  if (data.photoUrl) {
    try {
      cloudData = JSON.parse(atob(data.photoUrl));
    } catch {}
  }

  if (!cloudData) {
    cloudData = await fetchFirestoreData(uid, idToken);
  }

  const user = {
    uid,
    email: cleanEmail,
    displayName,
    idToken,
    proTier: cloudData?.proTier || 'none',
    verifiedUTRs: cloudData?.verifiedUTRs || [],
    favorites: cloudData?.favorites || []
  };

  saveUserSession(user);
  return user;
}

/**
 * Sign Up with Email, Password & Display Name
 */
export async function signUp(name, email, password) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim();

  if (!cleanName) throw new Error('Please enter your full name.');
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // 1. Create account in Firebase Auth
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const res = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      password,
      returnSecureToken: true
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(mapAuthError(data?.error?.message || 'Registration failed'));
  }

  const uid = data.localId;
  const idToken = data.idToken;

  // 2. Initial Cloud Data Payload
  const initialCloudData = {
    proTier: 'none',
    verifiedUTRs: [],
    favorites: [],
    updatedAt: Date.now() / 1000
  };
  const photoUrlPayload = btoa(JSON.stringify(initialCloudData));

  // 3. Update Display Name and PhotoURL (which stores metadata for macOS app sync)
  const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`;
  await fetch(updateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken,
      displayName: cleanName,
      photoUrl: photoUrlPayload,
      returnSecureToken: true
    })
  });

  // 4. Save to Firestore
  await writeFirestoreData(uid, idToken, {
    email: cleanEmail,
    displayName: cleanName,
    proTier: 'none',
    verifiedUTRs: [],
    createdAt: Date.now()
  });

  const user = {
    uid,
    email: cleanEmail,
    displayName: cleanName,
    idToken,
    proTier: 'none',
    verifiedUTRs: [],
    favorites: []
  };

  saveUserSession(user);
  return user;
}

/**
 * Upgrade User to Pro/Lifetime Tier
 * Synchronizes with Firestore AND base64 photoUrl payload so macOS app picks it up immediately
 */
export async function upgradeUserToPro(tier = 'lifetime', utr = '') {
  const current = getStoredUser();
  if (!current || !current.idToken) {
    throw new Error('Please sign in first to upgrade your account.');
  }

  const updatedUTRs = utr ? Array.from(new Set([...(current.verifiedUTRs || []), utr.trim()])) : (current.verifiedUTRs || []);

  const cloudData = {
    proTier: tier,
    verifiedUTRs: updatedUTRs,
    favorites: current.favorites || [],
    updatedAt: Date.now() / 1000
  };

  const payloadString = btoa(JSON.stringify(cloudData));

  // 1. Update Firebase Auth user photoUrl
  const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`;
  await fetch(updateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken: current.idToken,
      photoUrl: payloadString,
      returnSecureToken: true
    })
  });

  // 2. Update Firestore
  await writeFirestoreData(current.uid, current.idToken, {
    proTier: tier,
    verifiedUTRs: updatedUTRs,
    updatedAt: Date.now()
  });

  const updatedUser = {
    ...current,
    proTier: tier,
    verifiedUTRs: updatedUTRs
  };

  saveUserSession(updatedUser);
  return updatedUser;
}

/**
 * Helper to fetch data from Firestore REST
 */
async function fetchFirestoreData(uid, idToken) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?key=${API_KEY}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const fields = json.fields || {};
    return {
      proTier: fields.proTier?.stringValue || 'none',
      verifiedUTRs: fields.verifiedUTRs?.arrayValue?.values?.map(v => v.stringValue) || [],
      favorites: fields.favorites?.arrayValue?.values?.map(v => v.stringValue) || []
    };
  } catch {
    return null;
  }
}

/**
 * Helper to write data to Firestore REST
 */
async function writeFirestoreData(uid, idToken, data) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?key=${API_KEY}&updateMask.fieldPaths=proTier&updateMask.fieldPaths=verifiedUTRs&updateMask.fieldPaths=updatedAt`;
    
    const fields = {};
    if (data.proTier) fields.proTier = { stringValue: data.proTier };
    if (data.email) fields.email = { stringValue: data.email };
    if (data.displayName) fields.displayName = { stringValue: data.displayName };
    if (data.updatedAt) fields.updatedAt = { integerValue: String(data.updatedAt) };
    if (data.verifiedUTRs) {
      fields.verifiedUTRs = {
        arrayValue: {
          values: data.verifiedUTRs.map(u => ({ stringValue: u }))
        }
      };
    }

    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    console.warn('Firestore write warning:', err);
  }
}

function mapAuthError(msg) {
  if (msg.includes('EMAIL_EXISTS')) return 'An account with this email already exists. Please Sign In.';
  if (msg.includes('EMAIL_NOT_FOUND')) return 'No account found with this email. Please Sign Up.';
  if (msg.includes('INVALID_PASSWORD') || msg.includes('INVALID_LOGIN_CREDENTIALS')) return 'Invalid email or password.';
  if (msg.includes('USER_DISABLED')) return 'This user account has been disabled.';
  if (msg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) return 'Too many attempts. Please try again later.';
  if (msg.includes('WEAK_PASSWORD')) return 'Password must be at least 6 characters.';
  return msg;
}
