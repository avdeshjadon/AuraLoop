import { useEffect, useRef, useState } from 'react';
import { isEmail } from '../shared/a11y.js';
import { CLIENTS, TEAM_SIZES } from '../data.js';
import { Bolt, Check, Chevron } from '../icons.jsx';

const EMPTY = { email: '', size: '', client: '', updates: true };

function validate(v) {
  const e = {};
  if (!v.email.trim()) e.email = 'Add your email address for release notifications.';
  else if (!isEmail(v.email)) e.email = 'That address looks incomplete. It should look like name@domain.com.';
  if (!v.size) e.size = 'Select your Mac model.';
  if (!v.client) e.client = 'Choose your target macOS version.';
  return e;
}

export default function Waitlist() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState('idle');
  const doneRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (status === 'done') doneRef.current?.focus({ preventScroll: true });
  }, [status]);

  const set = (k, val) => {
    const next = { ...values, [k]: val };
    setValues(next);
    if (tried && (k === 'client' || k === 'size')) setErrors(validate(next));
  };

  const blur = k => () => {
    if (!tried) return;
    const e = validate(values);
    setErrors(prev => ({ ...prev, [k]: e[k] }));
  };

  const submit = e => {
    e.preventDefault();
    setTried(true);
    const errs = validate(values);
    setErrors(errs);
    const first = ['email', 'size', 'client'].find(k => errs[k]);
    if (first) {
      const id = first === 'client' ? `ta-ea-client-${values.client || CLIENTS[0]}` : `ta-ea-${first}`;
      document.getElementById(id.replace(/\s/g, '-'))?.focus();
      return;
    }
    setStatus('loading');
    timer.current = setTimeout(() => setStatus('done'), 1100);
  };

  const reset = () => {
    setValues(EMPTY);
    setErrors({});
    setTried(false);
    setStatus('idle');
    requestAnimationFrame(() => document.getElementById('ta-ea-email')?.focus());
  };

  const describe = (k, extra) => [extra, errors[k] ? `ta-ea-${k}-err` : null].filter(Boolean).join(' ') || undefined;

  return (
    <section id="waitlist" className="ta-sec ta-ea" aria-labelledby="ta-ea-title" tabIndex={-1}>
      <div className="ta-wrap">
        <div className="ta-ea__head" data-reveal>
          <p className="ta-eyebrow">
            <span>05</span> Downloads & Release Channel
          </p>
          <h2 id="ta-ea-title" className="ta-ea__title">
            Bring your Mac
            <br /> display to life.
          </h2>
          <p className="ta-lead">
            Native universal binary for Apple Silicon and Intel. Pre-bundled with 4K dynamic masters, zero telemetry, and zero battery drain.
          </p>
        </div>

        <div id="ta-ea-form" className="ta-ea__card" data-reveal>
          {status === 'done' ? (
            <div className="ta-ea__done" id="ta-ea-done" tabIndex={-1} ref={doneRef} role="status">
              <span className="ta-ea__tick" aria-hidden="true">
                <Check size={20} />
              </span>
              <p className="ta-ea__done-title">Download Initiated.</p>
              <p>AuraLoop-v1.4.2-Universal.dmg package configured for {values.size || 'Apple Silicon'}.</p>
              <button type="button" className="ta-btn ta-btn--ghost" onClick={reset}>
                Download another build
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate aria-busy={status === 'loading'}>
              <div className={`ta-field${errors.email ? ' is-error' : ''}`}>
                <label htmlFor="ta-ea-email">Email for release updates</label>
                <input
                  id="ta-ea-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@domain.com"
                  value={values.email}
                  onChange={e => set('email', e.target.value)}
                  onBlur={blur('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={describe('email')}
                />
                {errors.email && (
                  <p className="ta-err" id="ta-ea-email-err">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className={`ta-field${errors.size ? ' is-error' : ''}`}>
                <label htmlFor="ta-ea-size">Mac hardware profile</label>
                <div className="ta-select">
                  <select
                    id="ta-ea-size"
                    required
                    value={values.size}
                    onChange={e => set('size', e.target.value)}
                    onBlur={blur('size')}
                    aria-invalid={!!errors.size}
                    aria-describedby={describe('size')}
                  >
                    <option value="" disabled>
                      Choose your Mac model
                    </option>
                    {TEAM_SIZES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Chevron size={16} />
                </div>
                {errors.size && (
                  <p className="ta-err" id="ta-ea-size-err">
                    {errors.size}
                  </p>
                )}
              </div>

              <fieldset className={`ta-field ta-field--chips${errors.client ? ' is-error' : ''}`} aria-describedby={describe('client')}>
                <legend>Target macOS release</legend>
                <div className="ta-eachips">
                  {CLIENTS.map(c => {
                    const id = `ta-ea-client-${c}`.replace(/\s/g, '-');
                    return (
                      <label key={c} className={`ta-eachip${values.client === c ? ' is-on' : ''}`} htmlFor={id}>
                        <input
                          id={id}
                          type="radio"
                          name="ta-ea-client"
                          value={c}
                          checked={values.client === c}
                          onChange={() => set('client', c)}
                          aria-invalid={!!errors.client}
                        />
                        <span>{c}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.client && (
                  <p className="ta-err" id="ta-ea-client-err">
                    {errors.client}
                  </p>
                )}
              </fieldset>

              <label className="ta-check" htmlFor="ta-ea-updates">
                <input
                  id="ta-ea-updates"
                  type="checkbox"
                  checked={values.updates}
                  onChange={e => set('updates', e.target.checked)}
                />
                <span className="ta-check__box" aria-hidden="true">
                  <Check size={12} />
                </span>
                <span>Notify me when new 4K seasonal wallpaper packs drop</span>
              </label>

              <button type="submit" className="ta-btn ta-btn--ember ta-ea__submit" disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <>
                    <span className="ta-spinner" aria-hidden="true" /> Preparing .DMG package…
                  </>
                ) : (
                  <>
                    Download AuraLoop .DMG <Bolt size={14} />
                  </>
                )}
              </button>
              <p className="ta-ea__fine">Free & open source release. No accounts or credit cards required.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
