import confetti from 'canvas-confetti';
import { upgradeToLifetimePro } from './firebase';

let cashfreePromise = null;

/**
 * Ensures Cashfree Web SDK is loaded and returns the global constructor
 */
export function loadCashfreeSdk() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.Cashfree) return Promise.resolve(window.Cashfree);

  if (cashfreePromise) return cashfreePromise;

  cashfreePromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="cashfree.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Cashfree));
      existingScript.addEventListener('error', (err) => reject(new Error('Failed to load Cashfree SDK')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
      } else {
        reject(new Error('Cashfree SDK initialized without global constructor'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree script'));
    document.head.appendChild(script);
  });

  return cashfreePromise;
}

/**
 * Get Cashfree SDK instance with correct mode (sandbox or production)
 */
export async function getCashfreeInstance() {
  const CashfreeConstructor = await loadCashfreeSdk();
  const env = (import.meta.env.VITE_CASHFREE_ENV || 'PROD').toUpperCase();
  const mode = env === 'PROD' || env === 'PRODUCTION' ? 'production' : 'sandbox';
  return CashfreeConstructor({ mode });
}

/**
 * Creates an order on Cashfree via our backend API
 * Notice: 'amount' is no longer accepted from client payload to prevent Burp Suite tampering.
 * The server reads the pricing directly from the database!
 */
export async function createOrder({ user, planTitle = 'AuraLoop Lifetime Pro' } = {}) {
  if (!user || !user.uid) {
    throw new Error('Please log in first to proceed with payment.');
  }

  let idToken = '';
  try {
    const { auth } = await import('./firebase');
    if (auth?.currentUser) {
      idToken = await auth.currentUser.getIdToken();
    }
  } catch (e) {}

  const payload = {
    order_note: planTitle,
    customerId: user.uid,
    customerEmail: user.email || 'user@auraloop.app',
    customerName: user.displayName || (user.email ? user.email.split('@')[0] : 'AuraLoop User'),
    customerPhone: '9999999999',
  };

  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const res = await fetch('/api/cashfree/create-order', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to initiate checkout session.');
  }

  return data;
}

/**
 * Verifies order status with Cashfree via our backend API
 */
export async function verifyOrder(orderId) {
  if (!orderId) throw new Error('Order ID is required to verify status.');

  let idToken = '';
  try {
    const { auth } = await import('./firebase');
    if (auth?.currentUser) {
      idToken = await auth.currentUser.getIdToken();
    }
  } catch (e) {}

  const headers = {};
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const res = await fetch(`/api/cashfree/verify-order?order_id=${encodeURIComponent(orderId)}`, {
    headers,
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to verify payment status.');
  }

  return data;
}

/**
 * Triggers full checkout flow with Cashfree Drop-in Modal:
 * 1. Create order
 * 2. Open Cashfree modal
 * 3. Verify payment on completion
 * 4. Upgrade account to Lifetime Pro in Firestore + photoURL payload
 * 5. Trigger confetti animation
 */
export async function startCashfreeCheckout({
  user,
  pricing = {},
  onStatusChange = () => {},
  onSuccess = () => {},
  onError = () => {},
}) {
  try {
    if (!user) {
      const err = new Error('Please sign in or create an account to upgrade.');
      onError(err);
      throw err;
    }

    onStatusChange({ status: 'creating_order', message: 'Creating secure payment session...' });

    // Client amount is completely ignored by server to prevent Burp Suite tampering
    const orderData = await createOrder({
      user,
      planTitle: pricing.planTitle || 'AuraLoop Lifetime Pro',
    });

    const { payment_session_id, order_id } = orderData;
    if (!payment_session_id) {
      throw new Error('Invalid payment session received from gateway.');
    }

    onStatusChange({ status: 'opening_checkout', message: 'Opening Cashfree Checkout...' });

    const cashfree = await getCashfreeInstance();

    // Launch Cashfree drop-in popup modal
    const checkoutOptions = {
      paymentSessionId: payment_session_id,
      redirectTarget: '_modal',
    };

    const checkoutResult = await cashfree.checkout(checkoutOptions);

    if (checkoutResult && checkoutResult.error) {
      console.warn('[Cashfree Modal Result Error]:', checkoutResult.error);
      const msg = checkoutResult.error.message || 'Payment was cancelled or closed.';
      onStatusChange({ status: 'cancelled', message: msg });
      return { success: false, cancelled: true, message: msg };
    }

    // Modal finished or returned, verify with gateway
    onStatusChange({ status: 'verifying', message: 'Verifying payment with Cashfree...' });

    const verification = await verifyOrder(order_id);

    if (verification.isPaid) {
      onStatusChange({ status: 'upgrading', message: 'Payment confirmed! Upgrading to Lifetime Pro...' });

      // Upgrade user profile in Firebase
      const updatedProfile = await upgradeToLifetimePro(order_id);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onStatusChange({ status: 'success', message: 'Welcome to AuraLoop Lifetime Pro!' });
      onSuccess({ orderId: order_id, profile: updatedProfile });
      return { success: true, orderId: order_id, profile: updatedProfile };
    } else {
      const failMsg = `Payment status: ${verification.order_status}. Please retry if payment didn't go through.`;
      onStatusChange({ status: 'unpaid', message: failMsg });
      const err = new Error(failMsg);
      onError(err);
      return { success: false, status: verification.order_status, message: failMsg };
    }
  } catch (error) {
    console.error('[Cashfree Checkout Flow Failed]:', error);
    onStatusChange({ status: 'error', message: error.message || 'Payment flow failed.' });
    onError(error);
    return { success: false, error };
  }
}

/**
 * Voluntary Supporter Contribution Checkout
 * Allows users to donate flexible amounts (₹99, ₹199, ₹499, or custom) to support engineering & keep AuraLoop alive
 */
export async function startCashfreeDonation({
  user,
  amount = 99,
  onStatusChange = () => {},
  onSuccess = () => {},
  onError = () => {},
}) {
  try {
    if (!user) {
      const err = new Error('Please sign in or create an account to contribute.');
      onError(err);
      throw err;
    }

    const cleanAmount = Number(amount);
    if (isNaN(cleanAmount) || cleanAmount < 10) {
      const err = new Error('Please enter a valid contribution of at least ₹10.');
      onError(err);
      throw err;
    }

    onStatusChange({ status: 'creating_order', message: 'Creating secure contribution session...' });

    let idToken = '';
    try {
      const { auth } = await import('./firebase');
      if (auth?.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (e) {}

    const payload = {
      type: 'donation',
      amount: cleanAmount,
      customerId: user.uid,
      customerEmail: user.email || 'user@auraloop.app',
      customerName: user.displayName || (user.email ? user.email.split('@')[0] : 'AuraLoop Supporter'),
      customerPhone: '9999999999',
    };

    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

    const res = await fetch('/api/cashfree/create-order', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const orderData = await res.json();
    if (!res.ok || !orderData.success) {
      throw new Error(orderData.error || 'Failed to initiate contribution session.');
    }

    const { payment_session_id, order_id } = orderData;
    onStatusChange({ status: 'opening_checkout', message: 'Opening Cashfree Checkout...' });

    const cashfree = await getCashfreeInstance();
    const checkoutResult = await cashfree.checkout({
      paymentSessionId: payment_session_id,
      redirectTarget: '_modal',
    });

    if (checkoutResult && checkoutResult.error) {
      const msg = checkoutResult.error.message || 'Contribution was cancelled or closed.';
      onStatusChange({ status: 'cancelled', message: msg });
      return { success: false, cancelled: true, message: msg };
    }

    onStatusChange({ status: 'verifying', message: 'Verifying contribution with Cashfree...' });
    const verification = await verifyOrder(order_id);

    if (verification.isPaid) {
      onStatusChange({ status: 'recording', message: 'Thank you! Recording supporter contribution...' });
      const { recordDonation } = await import('./firebase');
      const updatedProfile = await recordDonation(verification.order_amount, order_id);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onStatusChange({ status: 'success', message: `Thank you for your generous contribution of ₹${verification.order_amount}!` });
      onSuccess({ orderId: order_id, amount: verification.order_amount, profile: updatedProfile });
      return { success: true, orderId: order_id, amount: verification.order_amount, profile: updatedProfile };
    } else {
      const failMsg = `Payment status: ${verification.order_status}. Please retry if payment didn't go through.`;
      onStatusChange({ status: 'unpaid', message: failMsg });
      const err = new Error(failMsg);
      onError(err);
      return { success: false, status: verification.order_status, message: failMsg };
    }
  } catch (error) {
    console.error('[Cashfree Donation Failed]:', error);
    onStatusChange({ status: 'error', message: error.message || 'Contribution flow failed.' });
    onError(error);
    return { success: false, error };
  }
}
