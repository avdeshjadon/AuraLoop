import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Zap, Sparkles, Check, Download, ArrowUpRight, Lock, Sun, Monitor, Heart } from 'lucide-react';
import { LATEST_DMG_URL } from '../lib.js';

export default function DocsPage({ initialTab = 'getting-started', onBack, onNavigateToPricing }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const TABS = [
    { id: 'getting-started', label: '1. Getting Started & Setup', icon: Zap },
    { id: 'features', label: '2. Subsystems & Architecture', icon: Monitor },
    { id: 'lockscreen', label: '3. ExtensionKit Lock Screen', icon: Lock },
    { id: 'privacy', label: '4. Privacy & Zero Telemetry Policy', icon: Shield },
    { id: 'licensing', label: '5. Lifetime Pro & Fair Pricing', icon: Sparkles },
    { id: 'faq', label: '6. FAQ & Troubleshooting', icon: Heart },
  ];

  const handleDownload = (e) => {
    e.preventDefault();
    window.location.href = LATEST_DMG_URL;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#eeeae4', color: '#17130f', fontFamily: 'inherit' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(238, 234, 228, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(23, 19, 15, 0.08)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #dcd5cc',
              padding: '8px 14px',
              borderRadius: '10px',
              color: '#17130f',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: '#17130f' }}>
              auraloop
            </span>
            <span style={{ fontSize: '11px', background: '#e2dcd5', color: '#443e39', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              Docs & Manual
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onNavigateToPricing && (
            <button
              type="button"
              onClick={onNavigateToPricing}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#685f58',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 12px',
              }}
            >
              Pricing & Support
            </button>
          )}

          <a
            href={LATEST_DMG_URL}
            onClick={handleDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#e4572e',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(228,87,46,0.35)',
            }}
          >
            <Download size={14} />
            <span>Download</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '36px',
          alignItems: 'start',
        }}
      >
        {/* Left Sidebar Menu */}
        <aside
          style={{
            position: 'sticky',
            top: '90px',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid rgba(23, 19, 15, 0.08)',
            padding: '16px 12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ padding: '8px 12px 14px', borderBottom: '1px solid #f2ede7', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e4572e' }}>
              Manual Navigation
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#17130f', marginTop: '2px' }}>
              System Guides
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    textAlign: 'left',
                    background: isSelected ? '#17130f' : 'transparent',
                    color: isSelected ? '#ffffff' : '#685f58',
                    fontSize: '13.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={isSelected ? '#e4572e' : '#8c827a'} />
                  <span style={{ flex: 1 }}>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div
            style={{
              marginTop: '28px',
              padding: '16px',
              borderRadius: '14px',
              background: '#faf6f0',
              border: '1px solid #eee4d8',
              fontSize: '12.5px',
              color: '#685f58',
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 700, color: '#17130f', marginBottom: '4px' }}>Technical Inquiries?</div>
            Crafted with pride by Avdesh Jadon. Write directly to{' '}
            <a href="mailto:theavdeshjadon@gmail.com" style={{ color: '#e4572e', fontWeight: 700, textDecoration: 'none' }}>
              theavdeshjadon@gmail.com
            </a>
          </div>
        </aside>

        {/* Right Content Area */}
        <main
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid rgba(23, 19, 15, 0.08)',
            padding: '44px 48px',
            boxShadow: '0 6px 28px rgba(0,0,0,0.04)',
            lineHeight: 1.7,
            color: '#443e39',
          }}
        >
          {/* TAB 1: Getting Started */}
          {activeTab === 'getting-started' && (
            <div>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e4572e', background: '#fdede8', padding: '4px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                Setup Guide
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', color: '#17130f', margin: '0 0 16px' }}>
                Getting Started with AuraLoop
              </h1>
              <p style={{ fontSize: '16px', color: '#685f58', marginBottom: '32px' }}>
                AuraLoop is a high-performance native macOS application engineered specifically for Apple Silicon (M1/M2/M3/M4) and Intel Macs running macOS Sonoma (14.0+) or macOS Sequoia (15.0+).
              </p>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#17130f', borderBottom: '1px solid #f2ede7', paddingBottom: '8px', marginTop: '32px' }}>
                1. Installation
              </h2>
              <ol style={{ paddingLeft: '24px', fontSize: '15px' }}>
                <li style={{ marginBottom: '10px' }}>
                  Download the official <strong>AuraLoop.dmg</strong> disk image directly from the website.
                </li>
                <li style={{ marginBottom: '10px' }}>
                  Open the downloaded disk image and drag <strong>AuraLoop.app</strong> into your Mac’s <strong>/Applications</strong> directory.
                </li>
                <li style={{ marginBottom: '10px' }}>
                  Launch AuraLoop from Applications. It resides quietly in your macOS menu bar with zero desktop clutter.
                </li>
              </ol>

              <div style={{ marginTop: '24px', padding: '16px 20px', borderRadius: '14px', background: '#faf6f0', border: '1px solid #eee4d8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#17130f' }}>Download Latest Installer</div>
                  <div style={{ fontSize: '13px', color: '#685f58' }}>Universal native binary for macOS 14.0 Sonoma & 15.0 Sequoia.</div>
                </div>
                <a
                  href={LATEST_DMG_URL}
                  onClick={handleDownload}
                  style={{
                    background: '#17130f',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#17130f', borderBottom: '1px solid #f2ede7', paddingBottom: '8px', marginTop: '36px' }}>
                2. System Permissions & Integrity
              </h2>
              <p style={{ fontSize: '15px' }}>
                AuraLoop strictly abides by Apple's sandboxing and App Management guidelines. To render 4K video layers beneath desktop icons without window interference, macOS requests:
              </p>
              <ul style={{ paddingLeft: '24px', fontSize: '15px' }}>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Screen Capture / Display Topology:</strong> Needed exclusively to calculate external display dimensions and aspect ratios across multiple Studio Displays or 4K/6K panels. Zero video frames or screen contents are ever captured or saved.
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Notification Services (Optional):</strong> Sends gentle notifications when a 4K wallpaper has finished caching or when solar dawn/dusk transitions take place.
                </li>
              </ul>
            </div>
          )}

          {/* TAB 2: Features & Architecture */}
          {activeTab === 'features' && (
            <div>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e4572e', background: '#fdede8', padding: '4px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                Core Engine
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', color: '#17130f', margin: '0 0 16px' }}>
                Subsystems & Hardware Architecture
              </h1>
              <p style={{ fontSize: '16px', color: '#685f58', marginBottom: '32px' }}>
                Rather than bundling Electron, Chromium, or high-overhead web wrappers, AuraLoop is compiled natively in Swift using Apple’s lowest-level media subsystems.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '24px' }}>
                <div style={{ padding: '22px', borderRadius: '16px', background: '#faf7f2', border: '1px solid #eeeae4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#17130f', fontSize: '16px', marginBottom: '6px' }}>
                    <Zap size={18} color="#e4572e" />
                    <span>AVFoundation & VideoToolbox Hardware Acceleration</span>
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#685f58' }}>
                    Videos are decoded directly through on-die Apple Silicon media engines (ProRes/HEVC decoders). This keeps CPU consumption under 0.8% and prevents fan spin-up even during 4K 60fps continuous loops.
                  </div>
                </div>

                <div style={{ padding: '22px', borderRadius: '16px', background: '#faf7f2', border: '1px solid #eeeae4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#17130f', fontSize: '16px', marginBottom: '6px' }}>
                    <Sun size={18} color="#e4572e" />
                    <span>Astronomical Offline Solar Elevation Engine</span>
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#685f58' }}>
                    Calculates exact civil twilight, solar noon, and golden hour using offline spherical trigonometric algorithms without pinging any weather APIs or tracking your GPS coordinates.
                  </div>
                </div>

                <div style={{ padding: '22px', borderRadius: '16px', background: '#faf7f2', border: '1px solid #eeeae4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#17130f', fontSize: '16px', marginBottom: '6px' }}>
                    <Monitor size={18} color="#e4572e" />
                    <span>Multi-Display Independence & Auto-Pause</span>
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#685f58' }}>
                    Assign different wallpapers to different monitors (Pro Display XDR, MacBook built-in Liquid Retina, ultra-wides). Intelligently pauses playback when games or full-screen apps take focus.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Lock Screen Sync */}
          {activeTab === 'lockscreen' && (
            <div>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e4572e', background: '#fdede8', padding: '4px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                ExtensionKit Deep Integration
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', color: '#17130f', margin: '0 0 16px' }}>
                macOS Lock Screen Synchronization
              </h1>
              <p style={{ fontSize: '16px', color: '#685f58', marginBottom: '32px' }}>
                In macOS Sonoma and Sequoia, Apple introduced ExtensionKit to allow third-party screensavers to bridge directly with the system lock screen. AuraLoop utilizes this framework natively.
              </p>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#17130f', borderBottom: '1px solid #f2ede7', paddingBottom: '8px', marginTop: '32px' }}>
                How to Enable Lock Screen Extension:
              </h2>
              <ol style={{ paddingLeft: '24px', fontSize: '15px' }}>
                <li style={{ marginBottom: '12px' }}>
                  Open macOS <strong>System Settings</strong> and navigate to <strong>Wallpaper</strong>.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  Scroll down to the <em>Screen Saver</em> section and select <strong>AuraLoop Engine</strong>.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  Enable the checkbox titled <em>"Show as wallpaper and screensaver"</em>.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  Lock your Mac at any time (<kbd style={{ background: '#f2ede7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #dcd5cc', fontSize: '13px' }}>Control + Command + Q</kbd>). Your live wallpaper continues moving seamlessly across the lock screen with zero flicker or hitch.
                </li>
              </ol>
            </div>
          )}

          {/* TAB 4: Zero Telemetry Policy */}
          {activeTab === 'privacy' && (
            <div>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#166534', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                Privacy Charter
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', color: '#17130f', margin: '0 0 16px' }}>
                Zero Telemetry & Absolute Privacy Policy
              </h1>
              
              <div style={{ padding: '20px', borderRadius: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '28px', fontSize: '15px', lineHeight: 1.6 }}>
                <strong>Zero Telemetry Commitment:</strong> AuraLoop collects ZERO personal telemetry, executes no background activity trackers, and respects your privacy unconditionally.
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#17130f', borderBottom: '1px solid #f2ede7', paddingBottom: '8px', marginTop: '28px' }}>
                Foundational Commitments
              </h2>
              <ul style={{ paddingLeft: '24px', fontSize: '15px' }}>
                <li style={{ marginBottom: '14px' }}>
                  <strong>No Tracking SDKs:</strong> There is zero Google Analytics, Segment, Mixpanel, Sentry, or third-party telemetry code bundled into either the macOS app or this website.
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <strong>100% Offline Resilience:</strong> Once wallpapers are cached locally, AuraLoop requires zero internet connection to execute schedules, playback, or display switches.
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <strong>Direct Bank-Grade Checkout:</strong> Transactions are routed through PCI-DSS Level 1 certified Cashfree Payment Gateway APIs. We never store or view your UPI PINs, credit card numbers, or banking credentials.
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <strong>No Ad Retargeting:</strong> We do not run Meta Pixel, TikTok tracking, or cookie-based ad retargeting pixels. Your visit here is private.
                </li>
              </ul>
            </div>
          )}

          {/* TAB 5: Lifetime Pro & Fair Pricing */}
          {activeTab === 'licensing' && (
            <div>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e4572e', background: '#fdede8', padding: '4px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                Fair Software
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', color: '#17130f', margin: '0 0 16px' }}>
                Transparent Pricing & Lifetime Pro
              </h1>
              <p style={{ fontSize: '16px', color: '#685f58', marginBottom: '32px' }}>
                We reject user-hostile recurring subscriptions for utility desktop software.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div style={{ padding: '24px', borderRadius: '18px', background: '#faf7f2', border: '1px solid #e2dcd5' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OVER 80% OF COLLECTION</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#17130f', margin: '6px 0 10px' }}>100% Free Forever</div>
                  <div style={{ fontSize: '14px', color: '#685f58' }}>
                    Access hundreds of 4K live moving aerials, nature time-lapses, dynamic cityscapes, and multi-monitor features at absolutely zero cost.
                  </div>
                </div>

                <div style={{ padding: '24px', borderRadius: '18px', background: '#faf7f2', border: '2px solid #e4572e' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#e4572e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ONE-TIME UNLOCK</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#17130f', margin: '6px 0 10px' }}>Lifetime Pro (₹199)</div>
                  <div style={{ fontSize: '14px', color: '#685f58' }}>
                    A single one-time contribution of ₹199 unlocks the exclusive Master Collection (1,582+ ProRes masters) to offset fast global CDN bandwidth.
                  </div>
                </div>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#17130f', borderBottom: '1px solid #f2ede7', paddingBottom: '8px', marginTop: '36px' }}>
                Voluntary Support ("Keep Me Alive")
              </h2>
              <p style={{ fontSize: '15px' }}>
                AuraLoop is developed independently by a solo developer. If you love the software and want to help support continued Apple Silicon optimization and CDN infrastructure, voluntary contributions (₹99, ₹199, ₹499) are deeply appreciated.
              </p>
            </div>
          )}

          {/* TAB 6: FAQ */}
          {activeTab === 'faq' && (
            <div>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e4572e', background: '#fdede8', padding: '4px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                Help & Answers
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', color: '#17130f', margin: '0 0 16px' }}>
                Frequently Asked Questions
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '28px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#17130f' }}>Does AuraLoop drain my MacBook battery?</div>
                  <div style={{ fontSize: '14.5px', color: '#685f58', marginTop: '6px' }}>
                    No. On battery power, AuraLoop can throttle down to 30fps or pause completely when the battery reaches 20%. Dedicated hardware media engines draw negligible wattage.
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#17130f' }}>How do I activate my Lifetime Pro tier inside the macOS app?</div>
                  <div style={{ fontSize: '14.5px', color: '#685f58', marginTop: '6px' }}>
                    Simply sign in to the macOS app using the exact same email address you used to purchase Pro on the website. Your license automatically syncs and unlocks all premium wallpapers within seconds.
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#17130f' }}>Is AuraLoop open source?</div>
                  <div style={{ fontSize: '14.5px', color: '#685f58', marginTop: '6px' }}>
                    AuraLoop is proprietary native macOS software crafted by Avdesh Jadon. Engine binaries, 4K ProRes catalog masters, and server infrastructure are privately maintained.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
