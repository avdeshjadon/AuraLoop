import { PRINCIPLES } from '../data.js';

export default function Manifesto() {
  return (
    <section id="manifesto" className="ta-sec ta-about" aria-labelledby="ta-about-title" tabIndex={-1}>

      <div className="ta-wrap">
        <div className="ta-about__top" data-reveal>
          <p className="ta-eyebrow">
            <span>04</span> Manifesto
          </p>
          <h2 id="ta-about-title" className="ta-about__name">
            <span className="sr-only">Manifesto: why we are called AuraLoop</span>
            <span aria-hidden="true">au·ra·loop</span>
            <small aria-hidden="true">living motion across every display</small>
          </h2>
        </div>

        <p className="ta-about__big" data-reveal>
          An aura is the subtle radiant atmosphere that surrounds natural wonders, while a loop is infinite seamless continuity.{' '}
          <em>Your Mac desktop should feel alive.</em>{' '}
          <span>
            AuraLoop breathes cinematic 4K motion into your displays and lock screen, calibrated to natural circadian
            light without sacrificing battery life or performance.
          </span>
        </p>

        <ol className="ta-principles" role="list" aria-label="Our principles">
          {PRINCIPLES.map(p => (
            <li key={p.n} data-reveal>
              <span className="ta-principles__n">{p.n}</span>
              <h3 className="ta-principles__t">{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
