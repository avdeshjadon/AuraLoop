// AuraLoop User Entitlements Serverless Function
// Manages real-time Pro Tier & Gifted Pro entitlements in Cloudflare R2

const ACCOUNT_ID = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const BUCKET = process.env.VITE_AURALOOP_R2_BUCKET || 'auraloop-wallpapers';
const API_TOKEN = process.env.VITE_CLOUDFLARE_API_TOKEN;
const R2_OBJECT_KEY = 'user_entitlements.json';

const R2_ENDPOINT = ACCOUNT_ID ? `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${R2_OBJECT_KEY}` : null;
const CDN_URL = `${process.env.VITE_CDN_BASE_URL || 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev'}/${R2_OBJECT_KEY}`;

async function fetchCurrentEntitlements() {
  try {
    const res = await fetch(`${CDN_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[Entitlements API] CDN read notice:', e?.message);
  }

  // Fallback to Cloudflare API read
  if (R2_ENDPOINT && API_TOKEN) {
    try {
      const apiRes = await fetch(R2_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      });
      if (apiRes.ok) {
        return await apiRes.json();
      }
    } catch (e) {
      console.warn('[Entitlements API] Cloudflare API read notice:', e?.message);
    }
  }

  return {};
}

async function saveEntitlementsToR2(entitlements) {
  if (!R2_ENDPOINT || !API_TOKEN) {
    console.warn('[Entitlements API] Cloudflare R2 credentials missing in environment.');
    return { success: false, warning: 'Credentials missing' };
  }

  const res = await fetch(R2_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entitlements, null, 2),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudflare R2 PUT failed (${res.status}): ${errText}`);
  }

  return await res.json();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // GET: Return all active entitlements
  if (req.method === 'GET') {
    try {
      const entitlements = await fetchCurrentEntitlements();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, entitlements }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // POST: Update entitlement for a specific email
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      } else if (!body) {
        body = {};
      }

      const { email, proTier, isGiftedPro, isSuspended, deleteUser, isDeleted } = body;
      if (!email || !email.includes('@')) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: 'Valid email is required' }));
      }

      const emailLower = email.trim().toLowerCase();
      const current = await fetchCurrentEntitlements();

      if (deleteUser || isDeleted) {
        current[emailLower] = {
          email: emailLower,
          isDeleted: true,
          status: 'Deleted',
          proTier: 'none',
          isGiftedPro: false,
          deletedAt: Date.now(),
        };

        await saveEntitlementsToR2(current);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          deleted: emailLower,
          entitlements: current,
        }));
      }

      const existingRecord = current[emailLower] || {};
      const updatedRecord = {
        ...existingRecord,
        email: emailLower,
        proTier: proTier !== undefined ? proTier : (existingRecord.proTier || 'none'),
        isGiftedPro: isGiftedPro !== undefined ? Boolean(isGiftedPro) : Boolean(existingRecord.isGiftedPro),
        isSuspended: isSuspended !== undefined ? Boolean(isSuspended) : Boolean(existingRecord.isSuspended),
        updatedAt: Date.now(),
      };

      current[emailLower] = updatedRecord;

      await saveEntitlementsToR2(current);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        user: updatedRecord,
        entitlements: current,
      }));
    } catch (err) {
      console.error('[Entitlements API Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
}

