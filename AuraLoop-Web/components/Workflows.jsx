import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WORKFLOWS } from '../data.js';
import { Chevron } from '../icons.jsx';

const ease = [0.2, 0.7, 0.2, 1];

function Case({ c, i, open, onToggle }) {
  const btnId = `ta-case-btn-${c.id}`;
  const panelId = `ta-case-panel-${c.id}`;

  return (
    <motion.li
      layout="position"
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className={`ta-case${open ? ' is-open' : ''}`}
      onClick={onToggle}
      style={{
        cursor: 'pointer',
        borderRadius: '24px',
        background: '#ffffff',
        border: open ? '1px solid rgba(228, 87, 46, 0.35)' : '1px solid rgba(23, 19, 15, 0.08)',
        boxShadow: open
          ? '0 18px 45px -12px rgba(23, 19, 15, 0.12), 0 0 0 1px rgba(228, 87, 46, 0.15)'
          : '0 2px 8px -2px rgba(23, 19, 15, 0.05)',
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <h3 className="ta-case__h" style={{ margin: 0 }}>
        <button
          type="button"
          id={btnId}
          className="ta-case__btn"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={e => {
            e.stopPropagation();
            onToggle();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            width: '100%',
            padding: '24px 32px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          {/* Left: Number + Title + Subtitle */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: 1 }}>
            <span
              style={{
                fontFamily: 'var(--ta-mono)',
                fontSize: '13px',
                fontWeight: 600,
                color: open ? 'var(--ta-ember)' : 'var(--ta-ink-3)',
                paddingTop: '4px',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 650,
                  letterSpacing: '-0.025em',
                  color: 'var(--ta-ink)',
                  lineHeight: 1.2,
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  color: 'var(--ta-ink-3)',
                  marginTop: '4px',
                  fontWeight: 450,
                }}
              >
                {c.who}
              </div>
            </div>
          </div>

          {/* Center-Right: Clean Metric Comparison */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '8px',
                fontSize: '17px',
                letterSpacing: '-0.02em',
              }}
            >
              <s style={{ color: '#9c9288', textDecorationThickness: '1.5px', fontWeight: 500 }}>
                {c.metric.from}
              </s>
              <span style={{ color: 'var(--ta-ember)', fontSize: '14px', fontWeight: 600 }}>→</span>
              <b style={{ color: 'var(--ta-ink)', fontWeight: 700 }}>
                {c.metric.to}
              </b>
            </div>
            <small style={{ fontSize: '11.5px', color: 'var(--ta-ink-3)', textTransform: 'capitalize' }}>
              {c.metric.label}
            </small>
          </div>

          {/* Right: Modern Rotating Chevron Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: open ? 'var(--ta-ink)' : 'var(--ta-bg-2)',
              color: open ? '#ffffff' : 'var(--ta-ink-2)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: open ? '0 4px 12px rgba(0,0,0,0.15)' : 'inset 0 0 0 1px var(--ta-line-soft)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'all 0.3s cubic-bezier(0.2, 0.7, 0.2, 1)',
              flexShrink: 0,
            }}
          >
            <Chevron size={16} />
          </div>
        </button>
      </h3>

      {/* Accordion Expandable Panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 32px 32px 76px',
                borderTop: '1px solid rgba(23, 19, 15, 0.06)',
                paddingTop: '24px',
              }}
            >
              {/* Premium Harmonious Comparison Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                {/* Before: Subtle Muted Card */}
                <div
                  style={{
                    background: '#f8f6f3',
                    border: '1px solid rgba(23, 19, 15, 0.08)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#8c8278',
                      marginBottom: '6px',
                    }}
                  >
                    Standard Wallpaper / Web-Based Engines
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--ta-ink-2)', lineHeight: 1.5 }}>
                    {c.before}
                  </div>
                </div>

                {/* After: Clean Brand Accent Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(228,87,46,0.06) 0%, rgba(228,87,46,0.02) 100%)',
                    border: '1px solid rgba(228,87,46,0.22)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--ta-ember)',
                      marginBottom: '6px',
                    }}
                  >
                    With AuraLoop Native AVFoundation
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--ta-ink)', fontWeight: 600, lineHeight: 1.5 }}>
                    {c.after}
                  </div>
                </div>
              </div>

              {/* 3 Step Details Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '14px',
                }}
              >
                {c.steps.map((s, k) => (
                  <div
                    key={s.title}
                    style={{
                      background: 'rgba(244, 240, 235, 0.5)',
                      border: '1px solid rgba(23, 19, 15, 0.05)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--ta-mono)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--ta-ember)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      STEP {String(k + 1).padStart(2, '0')}
                    </span>
                    <strong
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 650,
                        letterSpacing: '-0.015em',
                        color: 'var(--ta-ink)',
                        lineHeight: 1.3,
                      }}
                    >
                      {s.title}
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--ta-ink-2)',
                        lineHeight: 1.5,
                      }}
                    >
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default function Workflows() {
  const [open, setOpen] = useState('battery');

  return (
    <section id="workflows" className="ta-sec ta-cases" aria-labelledby="ta-cases-title" tabIndex={-1}>
      <div className="ta-wrap">
        <div className="ta-sec__head" data-reveal>
          <div className="ta-sec__title">
            <p className="ta-eyebrow">
              <span>03</span> Workflows
            </p>
            <h2 id="ta-cases-title" className="ta-h2">
              How Mac power users run AuraLoop
            </h2>
          </div>
          <div className="ta-sec__aside">
            <p className="ta-flag">
              <span className="ta-tag ta-tag--solid">Hardware-accelerated performance profiles</span>
            </p>
            <p className="ta-lead">
              Three real-world desk setups showing how AuraLoop adapts to battery state, display geometry, and circadian solar rhythms.
            </p>
          </div>
        </div>

        <ol
          className="ta-case-list"
          role="list"
          data-reveal
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}
        >
          {WORKFLOWS.map((c, i) => (
            <Case
              key={c.id}
              c={c}
              i={i}
              open={open === c.id}
              onToggle={() => setOpen(o => (o === c.id ? null : c.id))}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
