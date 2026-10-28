import { useState } from 'react';
import { usePricing } from '../lib/pricingService.js';
import { startCashfreeCheckout, startCashfreeDonation } from '../lib/paymentService.js';
import { Check, Sparkles, Heart, Shield, ArrowRight } from 'lucide-react';

export default function PricingSection({ user, onOpenAuth, onUserUpdated }) {
  const pricing = usePricing();
  const [selectedDonation, setSelectedDonation] = useState(199);
  const [customDonation, setCustomDonation] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Status states
  const [proLoading, setProLoading] = useState(false);
  const [proStatus, setProStatus] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateStatus, setDonateStatus] = useState('');
  const [feedback, setFeedback] = useState(null); // { message, type }

  const isPro = user?.proTier && user?.proTier !== 'none';
  const totalDonated = user?.totalDonated || 0;
  const isSupporter = user?.isSupporter || totalDonated > 0;

  const handleProUpgrade = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signup');
      return;
    }
    setProLoading(true);
    setProStatus('Creating secure checkout...');
    setFeedback(null);

    try {
      await startCashfreeCheckout({
        user,
        pricing,
        onStatusChange: ({ message }) => setProStatus(message),
        onSuccess: ({ orderId, profile }) => {
          setFeedback({ message: `Payment successful! Welcome to Lifetime Pro (Order: ${orderId})`, type: 'success' });
          setProStatus('');
          if (onUserUpdated && profile) onUserUpdated(profile);
        },
        onError: (err) => {
          setFeedback({ message: err.message || 'Payment could not be completed.', type: 'error' });
          setProStatus('');
        }
      });
    } catch (err) {
      setFeedback({ message: err.message || 'Checkout initiation error.', type: 'error' });
    } finally {
      setProLoading(false);
    }
  };

  const handleDonation = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signup');
      return;
    }

    const amount = isCustom ? Number(customDonation) : selectedDonation;
    if (isNaN(amount) || amount < 10) {
      setFeedback({ message: 'Please enter a voluntary contribution of at least ₹10.', type: 'error' });
      return;
    }

    setDonateLoading(true);
    setDonateStatus('Creating secure contribution...');
    setFeedback(null);

    try {
      await startCashfreeDonation({
        user,
        amount,
        onStatusChange: ({ message }) => setDonateStatus(message),
        onSuccess: ({ orderId, amount: paidAmt, profile }) => {
          setFeedback({ message: `Thank you with all our heart! Your contribution of ₹${paidAmt} has been recorded (Order: ${orderId}).`, type: 'success' });
          setDonateStatus('');
          if (onUserUpdated && profile) onUserUpdated(profile);
        },
        onError: (err) => {
          setFeedback({ message: err.message || 'Contribution could not be processed.', type: 'error' });
          setDonateStatus('');
        }
      });
    } catch (err) {
      setFeedback({ message: err.message || 'Donation failed.', type: 'error' });
    } finally {
      setDonateLoading(false);
    }
  };

  return (
    <section id="pricing" className="ta-section" style={{ position: 'relative', padding: '96px 24px', background: 'radial-gradient(ellipse at top, #faf7f2 0%, #eeeae4 100%)' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 64px auto' }} data-reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(228,87,46,0.1)', color: '#b93c18', fontSize: '12.5px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '18px' }}>
            <Sparkles size={14} />
            <span>Transparent Pricing & Open Access</span>
          </div>
          
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', letterSpacing: '-0.025em', color: '#17130f', lineHeight: 1.15, margin: '0 0 18px 0' }}>
            Most of AuraLoop is 100% Free.<br />Support the Craft If You Wish.
          </h2>

          <p style={{ fontSize: '16.5px', lineHeight: 1.65, color: '#685f58', margin: 0 }}>
            Over <strong>80% of our 4K video wallpaper library is completely free forever</strong> for every Mac user.
            We charge a small, transparent one-time fee for our exclusive Master Collection to offset ultra-high-bandwidth 4K video CDN costs and native Apple Silicon engineering. Optional donations directly fund solo development and keep AuraLoop alive.
          </p>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto 36px auto',
              padding: '14px 20px',
              borderRadius: '12px',
              background: feedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
              color: feedback.type === 'error' ? '#991b1b' : '#166534',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Two-Column Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>
          
          {/* Card 1: AuraLoop Lifetime Pro */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px 32px',
              border: isPro ? '2px solid #22c55e' : '2px solid #e4572e',
              boxShadow: '0 16px 40px -12px rgba(228,87,46,0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            data-reveal
          >
            {isPro && (
              <div style={{ position: 'absolute', top: '-13px', right: '28px', background: '#22c55e', color: '#ffffff', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', boxShadow: '0 4px 10px rgba(34,197,94,0.3)' }}>
                Active on Your Account
              </div>
            )}
            {!isPro && (
              <div style={{ position: 'absolute', top: '-13px', right: '28px', background: '#e4572e', color: '#ffffff', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', boxShadow: '0 4px 10px rgba(228,87,46,0.3)' }}>
                One-Time Purchase
              </div>
            )}

            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c827a', marginBottom: '8px' }}>
                Exclusive Master Collection
              </div>
              <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#17130f', margin: '0 0 10px 0' }}>
                AuraLoop Lifetime Pro
              </h3>
              <p style={{ fontSize: '14.5px', color: '#685f58', lineHeight: 1.5, marginBottom: '22px' }}>
                Unlock all 1,582+ live 4K wallpapers, 60fps ProRes masters, and native ExtensionKit lockscreen sync across Mac & Web forever.
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                <span style={{ fontSize: '42px', fontWeight: '900', color: '#e4572e', letterSpacing: '-0.03em' }}>
                  {pricing.currency}{pricing.price}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#8c827a' }}>
                  / single payment, forever
                </span>
              </div>

              {/* Benefits list */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  '1,582+ Handcrafted 4K live looping wallpapers',
                  'High-efficiency HEVC & Apple ProRes 60fps quality',
                  'Seamless ExtensionKit lockscreen & screensaver sync',
                  'Real-time audio visualizer & Night Shift Kelvin matching',
                  'Unlimited multi-monitor & 8K Ultra-Wide screen support',
                  'Zero subscriptions — pay once, enjoy all future catalog updates'
                ].map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#443e39', lineHeight: 1.45 }}>
                    <span style={{ color: '#e4572e', marginTop: '2px', flexShrink: 0 }}><Check size={16} /></span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <button
                type="button"
                disabled={proLoading || isPro}
                onClick={handleProUpgrade}
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  borderRadius: '14px',
                  border: 'none',
                  background: isPro
                    ? '#f0fdf4'
                    : proLoading
                    ? '#a8a29e'
                    : 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
                  color: isPro ? '#166534' : '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: isPro || proLoading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isPro || proLoading ? 'none' : '0 6px 20px rgba(228,87,46,0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>
                  {isPro
                    ? '✓ Lifetime Pro Unlocked'
                    : proLoading
                    ? (proStatus || 'Connecting to Cashfree...')
                    : `Upgrade to Lifetime Pro (${pricing.currency}${pricing.price})`}
                </span>
                {!isPro && !proLoading && <ArrowRight size={16} />}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: '#8c827a' }}>
                <Shield size={13} />
                <span>Encrypted direct payment via Cashfree • Instant sync</span>
              </div>
            </div>
          </div>

          {/* Card 2: Keep AuraLoop Alive (Voluntary Donation) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px 32px',
              border: isSupporter ? '2px solid #ec4899' : '1px solid #dcd5cc',
              boxShadow: '0 12px 32px -8px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            data-reveal
          >
            {isSupporter && (
              <div style={{ position: 'absolute', top: '-13px', right: '28px', background: '#ec4899', color: '#ffffff', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', boxShadow: '0 4px 10px rgba(236,72,153,0.3)' }}>
                ❤️ Proud Supporter (₹{totalDonated})
              </div>
            )}
            {!isSupporter && (
              <div style={{ position: 'absolute', top: '-13px', right: '28px', background: '#64748b', color: '#ffffff', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px' }}>
                Voluntary Contribution
              </div>
            )}

            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c827a', marginBottom: '8px' }}>
                Keep Me Alive & Solo Development
              </div>
              <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#17130f', margin: '0 0 10px 0' }}>
                Support the Mission
              </h3>
              <p style={{ fontSize: '14.5px', color: '#685f58', lineHeight: 1.5, marginBottom: '20px' }}>
                AuraLoop is built with obsessive care by an independent engineer. No venture capital, no ads, and zero user telemetry. If you appreciate having an ultra-performant native app, consider a voluntary tip to support continuous maintenance and new 4K captures.
              </p>

              {/* Supporter Badge if already contributed */}
              {isSupporter && (
                <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#fdf2f8', border: '1px solid #fbcfe8', color: '#9d174d', fontSize: '13.5px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Heart size={20} fill="#ec4899" color="#ec4899" />
                  <div>
                    <div>You are a Proud Supporter of AuraLoop!</div>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#be185d' }}>Total contribution so far: ₹{totalDonated}. Feel free to donate more below.</div>
                  </div>
                </div>
              )}

              {/* Preset Amount Chips */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#443e39', marginBottom: '10px' }}>
                  Select Contribution Amount:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[99, 199, 499].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedDonation(amt);
                        setIsCustom(false);
                      }}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '10px',
                        border: !isCustom && selectedDonation === amt ? '2px solid #17130f' : '1px solid #dcd5cc',
                        background: !isCustom && selectedDonation === amt ? '#17130f' : '#faf8f5',
                        color: !isCustom && selectedDonation === amt ? '#ffffff' : '#17130f',
                        fontSize: '13.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: isCustom ? '2px solid #17130f' : '1px solid #dcd5cc',
                      background: isCustom ? '#17130f' : '#faf8f5',
                      color: isCustom ? '#ffffff' : '#17130f',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Custom Input */}
              {isCustom && (
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#8c827a' }}>₹</span>
                    <input
                      type="number"
                      min="10"
                      placeholder="Enter amount (min ₹10)"
                      value={customDonation}
                      onChange={(e) => setCustomDonation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 30px',
                        borderRadius: '10px',
                        border: '1px solid #dcd5cc',
                        fontSize: '14px',
                        fontWeight: '600',
                        background: '#faf8f5',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                disabled={donateLoading}
                onClick={handleDonation}
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  borderRadius: '14px',
                  border: '1px solid #17130f',
                  background: donateLoading ? '#a8a29e' : '#17130f',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: donateLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Heart size={16} fill="#ffffff" />
                <span>
                  {donateLoading
                    ? (donateStatus || 'Connecting to Cashfree...')
                    : isSupporter
                    ? `Donate More (₹${isCustom ? (customDonation || 0) : selectedDonation})`
                    : `Support with ₹${isCustom ? (customDonation || 0) : selectedDonation}`}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: '#8c827a' }}>
                <span>Supports UPI (GPay, PhonePe, Paytm QR) & Cards</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
