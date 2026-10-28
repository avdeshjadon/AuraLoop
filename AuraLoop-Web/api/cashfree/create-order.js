// Serverless function to create Cashfree PG Order
// Fully secured: Pricing is strictly fetched from database/server-side to prevent Burp Suite tampering.

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

  // Fallback to secure server-enforced base price
  return { price: SERVER_DEFAULT_PRICE, currency: 'INR' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    } else if (!body) {
      body = {};
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

    // 🔒 SECURITY PROTECTION:
    // Extract ID token from Authorization header
    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    const isDonation = body.type === 'donation';
    let orderAmount = 0;
    let orderCurrency = 'INR';
    let orderPrefix = 'auraloop_pro';
    let orderNote = 'AuraLoop Lifetime Pro Upgrade';

    if (isDonation) {
      // Voluntary contribution (user selectable amount, minimum ₹10 floor)
      const requestedAmount = Number(body.amount);
      if (isNaN(requestedAmount) || requestedAmount < 10) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: 'Minimum contribution amount is ₹10.' }));
      }
      orderAmount = requestedAmount;
      orderPrefix = 'auraloop_donate';
      orderNote = 'AuraLoop Supporter Donation (Keep Me Alive)';
    } else {
      // Pro upgrade: ALWAYS determine amount server-side from database.
      // Client-provided 'body.amount' is INTENTIONALLY IGNORED to prevent tampering
      // via Burp Suite, proxy tools, or modified client payloads.
      const { price: authoritativePrice, currency: authoritativeCurrency } = await getAuthoritativePricing(idToken);
      orderAmount = Number(authoritativePrice);
      orderCurrency = authoritativeCurrency || 'INR';

      // Anti-tampering floor: Under no circumstances allow a pro order below ₹10
      if (isNaN(orderAmount) || orderAmount < 10) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: 'Security validation failed: Invalid pricing configuration.' }));
      }
    }

    // Unique order ID format: <prefix>_<timestamp>_<random>
    const orderId = `${orderPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const customer = body.customer_details || {};
    const customerId = (customer.customer_id || body.customerId || `cust_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const customerEmail = customer.customer_email || body.customerEmail || 'user@auraloop.app';
    const customerPhone = customer.customer_phone || body.customerPhone || '9999999999';
    const customerName = customer.customer_name || body.customerName || 'AuraLoop User';

    const returnUrl = body.return_url || `https://aura-loop.vercel.app/?order_id={order_id}`;

    const payload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: customerId,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName,
      },
      order_meta: {
        return_url: returnUrl,
      },
      order_note: orderNote,
    };

    const cfResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await cfResponse.json();

    if (!cfResponse.ok) {
      res.statusCode = cfResponse.status || 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: data.message || 'Failed to create Cashfree order',
        details: data,
      }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      order_id: data.order_id,
      cf_order_id: data.cf_order_id,
      payment_session_id: data.payment_session_id,
      order_status: data.order_status,
      order_amount: data.order_amount,
      order_currency: data.order_currency,
      env: envMode,
    }));
  } catch (error) {
    console.error('[Cashfree create-order error]:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }));
  }
}
