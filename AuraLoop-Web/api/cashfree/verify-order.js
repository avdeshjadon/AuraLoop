// Serverless function to verify Cashfree PG Order Status
// Fully secured: Verifies that paid amount actually matches authoritative database pricing.

async function getAuthoritativePricing(idToken) {
  const SERVER_DEFAULT_PRICE = 199.00;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'auraloop-5358f';

  if (idToken) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/pricing`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data?.fields?.price?.integerValue || data?.fields?.price?.doubleValue;
        if (raw !== undefined) {
          const val = Number(raw);
          if (val > 0) {
            return { price: val, currency: 'INR' };
          }
        }
      }
    } catch (e) {
      console.warn('[Pricing Security] Firestore REST query warning:', e?.message);
    }
  }

  return { price: SERVER_DEFAULT_PRICE, currency: 'INR' };
}

export default async function handler(req, res) {
  try {
    let orderId = '';
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      orderId = url.searchParams.get('order_id');
    } else if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      orderId = body?.order_id;
    }

    if (!orderId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Missing order_id' }));
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const envMode = (process.env.CASHFREE_ENV || 'PROD').toUpperCase();

    if (!appId || !secretKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'Cashfree configuration error: CASHFREE_APP_ID or CASHFREE_SECRET_KEY missing from environment variables.',
      }));
    }

    const baseUrl = envMode === 'PROD' || envMode === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    const cfResponse = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });

    const data = await cfResponse.json();

    if (!cfResponse.ok) {
      res.statusCode = cfResponse.status || 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: data.message || 'Failed to verify Cashfree order',
        details: data,
      }));
    }

    const isPaid = data.order_status === 'PAID';
    const isDonation = data.order_id?.startsWith('auraloop_donate_');

    // 🔒 Anti-Tampering Check:
    if (isPaid) {
      const paidAmount = Number(data.order_amount);

      if (isDonation) {
        // Donation must be at least ₹10
        if (isNaN(paidAmount) || paidAmount < 10) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: false,
            error: 'Invalid contribution amount.',
          }));
        }
      } else {
        // Lifetime Pro upgrade: verify that paid amount matches authoritative database price
        const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const { price: requiredPrice } = await getAuthoritativePricing(idToken);

        if (isNaN(paidAmount) || paidAmount < requiredPrice) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: false,
            error: `Tampering detected: Paid amount (₹${paidAmount}) is less than required price (₹${requiredPrice}). Upgrade denied.`,
          }));
        }
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      isPaid,
      isDonation,
      order_id: data.order_id,
      cf_order_id: data.cf_order_id,
      order_status: data.order_status,
      order_amount: data.order_amount,
      order_currency: data.order_currency,
      created_at: data.created_at,
    }));
  } catch (error) {
    console.error('[Cashfree verify-order error]:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }));
  }
}
