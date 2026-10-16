import { Fragment } from 'react';
import { ArrowRight, SparklesIcon, DownloadIcon } from '../icons.jsx';
import { Monogram } from './Nav.jsx';

const STATEMENT = [
  ['Engineered'],
  ['purely'],
  ['in'],
  ['Swift', 'em'],
  ['and'],
  ['SwiftUI', 'em'],
  ['for'],
  ['macOS', 'em'],
  ['—'],
  ['delivering'],
  ['continuous'],
  ['4K'],
  ['cinematic'],
  ['motion', 'em'],
  ['to'],
  ['every'],
  ['connected'],
  ['display'],
  ['with'],
  ['zero'],
  ['fan'],
  ['noise.'],
];

export default function About({ onDownload }) {
  return (
    <section className="ch-section ch-about" id="about" aria-labelledby="ch-about-title">
      <div className="ch-wrap">
        <div className="ch-about__top">
          <p className="ch-label">
            <SparklesIcon size={15} /> Native macOS
          </p>
          <Monogram size="lg" />
        </div>
        <h2 className="sr-only" id="ch-about-title">
          About AuraLoop
        </h2>
        <p className="ch-statement" data-reveal-stagger="0.035" data-reveal-y="0">
          {STATEMENT.map(([w, kind], i) => (
            <Fragment key={i}>
              <span className={`ch-statement__w ${kind ? `is-${kind}` : ''}`}>{w}</span>{' '}
            </Fragment>
          ))}
        </p>

        <div className="ch-about__row">
          <div className="ch-about__note">
            <p className="ch-kicker">Craft &amp; Architecture</p>
            <p>
              Designed and developed by Avdesh Jadon. AuraLoop is a closed-source, proprietary macOS application built with AVFoundation, Metal, and ExtensionKit. Universal binary supporting Apple Silicon (M1–M4) and Intel Macs on macOS Sonoma &amp; Sequoia.
            </p>
          </div>
          <div className="ch-about__ctas">
            <button type="button" className="ch-btn ch-btn--raised" onClick={onDownload}>
              <DownloadIcon size={16} style={{ marginRight: 6 }} /> Download AuraLoop .DMG
            </button>
            <a href="#wallpapers" className="ch-btn ch-btn--ghost">
              Browse 4K catalog
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
