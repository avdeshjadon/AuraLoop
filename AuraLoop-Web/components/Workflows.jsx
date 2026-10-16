import { useState } from 'react';
import { motion } from 'motion/react';
import { WORKFLOWS } from '../data.js';
import { Plus } from '../icons.jsx';

const ease = [0.2, 0.7, 0.2, 1];

function Case({ c, i, open, onToggle }) {
  const btnId = `ta-case-btn-${c.id}`;
  const panelId = `ta-case-panel-${c.id}`;
  return (
    <motion.li layout="position" transition={{ type: 'spring', bounce: 0, duration: 0.5 }} className={`ta-case${open ? ' is-open' : ''}`}>
      <h3 className="ta-case__h">
        <button type="button" id={btnId} className="ta-case__btn" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <span className="ta-case__n">{String(i + 1).padStart(2, '0')}</span>
          <span className="ta-case__title">
            <span>{c.title}</span>
            <small>{c.who}</small>
          </span>
          <span className="ta-case__metric">
            <span className="ta-tag" style={{ background: 'rgba(228,87,46,0.1)', color: '#e4572e', border: '1px solid rgba(228,87,46,0.2)' }}>
              {c.chip || 'Apple Silicon'}
            </span>
            <span className="ta-case__fromto">
              <s>{c.metric.from}</s>
              <span aria-hidden="true">→</span>
              <span className="sr-only">to</span>
              <b>{c.metric.to}</b>
            </span>
            <small>{c.metric.label}</small>
          </span>
          <span className="ta-case__plus" aria-hidden="true">
            <Plus size={18} />
          </span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={btnId} hidden={!open} className="ta-case__panel">
        {open && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
            <dl className="ta-case__ba">
              <div style={{ background: 'rgba(239, 68, 68, 0.04)', borderLeft: '3px solid #ef4444', padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>
                <dt style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Standard Wallpaper / Web-Based Engines
                </dt>
                <dd style={{ marginTop: 4, color: 'var(--ta-ink)' }}>{c.before}</dd>
              </div>
              <div style={{ background: 'rgba(34, 197, 94, 0.05)', borderLeft: '3px solid #22c55e', padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>
                <dt style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  With AuraLoop Native AVFoundation
                </dt>
                <dd style={{ marginTop: 4, color: 'var(--ta-ink)', fontWeight: 500 }}>{c.after}</dd>
              </div>
            </dl>
            <ol className="ta-case__steps" role="list">
              {c.steps.map((s, k) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 + k * 0.06, ease }}
                >
                  <span className="ta-case__step">{String(k + 1).padStart(2, '0')}</span>
                  <strong>{s.title}</strong>
                  <p>{s.body}</p>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </div>
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

        <ol className="ta-case-list" role="list" data-reveal>
          {WORKFLOWS.map((c, i) => (
            <Case key={c.id} c={c} i={i} open={open === c.id} onToggle={() => setOpen(o => (o === c.id ? null : c.id))} />
          ))}
        </ol>
      </div>
    </section>
  );
}
