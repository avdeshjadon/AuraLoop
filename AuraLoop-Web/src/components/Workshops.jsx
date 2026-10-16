import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { isEmail } from '../shared/a11y.js';
import { FORMATS, TALKS } from '../data.js';
import { required, useDemoForm, useReduced } from '../lib.jsx';
import { ArrowRight, CheckIcon, GroupIcon, Spinner, UndoIcon } from '../icons.jsx';
import Field from './Field.jsx';

const RULES = {
  name: required('your Mac model or name'),
  email: v => (!v.trim() ? 'Please add your email.' : !isEmail(v) ? 'Enter a valid email, like name@example.com.' : ''),
  monitors: v => (v ? '' : 'Choose how many displays you use.'),
  preset: v => (v ? '' : 'Select an automation preset.'),
};

const INITIAL = { name: '', email: '', monitors: '1 Display (Built-in)', preset: '', notes: '' };
const MONITORS = ['1 Display (Built-in)', 'Dual Displays (4K/5K)', 'Triple Displays', 'Pro Display XDR / Studio Display'];

function RequestForm({ talk, setTalk, formRef: outerRef }) {
  const f = useDemoForm(INITIAL, RULES, { delay: 900 });
  const doneRef = useRef(null);

  useEffect(() => {
    f.set('preset', talk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talk]);

  useEffect(() => {
    if (f.status === 'success') doneRef.current?.focus({ preventScroll: true });
  }, [f.status]);

  const loading = f.status === 'loading';

  if (f.status === 'success') {
    const picked = TALKS.find(t => t.id === f.values.preset);
    return (
      <div className="ch-formcard__done" ref={outerRef}>
        <span className="ch-donemark" aria-hidden="true">
          <CheckIcon size={20} />
        </span>
        <h3 tabIndex={-1} ref={doneRef} className="ch-h3">
          Automation profile saved.
        </h3>
        <p role="status">Preset configured for your Mac setup. Ready to load directly into AuraLoop.</p>
        <dl className="ch-summary">
          <div>
            <dt>Device / Setup</dt>
            <dd>{f.values.name}</dd>
          </div>
          <div>
            <dt>Monitors</dt>
            <dd>{f.values.monitors}</dd>
          </div>
          <div>
            <dt>Automation</dt>
            <dd>{picked ? picked.title : 'Custom Schedule'}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="ch-btn ch-btn--ghost"
          onClick={() => {
            f.reset();
            setTalk('');
          }}
        >
          <UndoIcon size={15} /> Configure another profile
        </button>
      </div>
    );
  }

  return (
    <form
      ref={el => {
        f.formRef.current = el;
        if (outerRef) outerRef.current = el;
      }}
      noValidate
      onSubmit={f.onSubmit}
      className="ch-form"
      aria-labelledby="ch-talkform-title"
    >
      <h3 className="ch-h3" id="ch-talkform-title">
        Configure Automation Profile
      </h3>
      <div className="ch-form__grid">
        <Field
          id="ch-talk-name"
          label="Mac Model (e.g. MacBook Pro M3)"
          error={f.errors.name}
          readOnly={loading}
          {...f.bind('name')}
        />
        <Field
          id="ch-talk-email"
          label="Email for profile sync"
          type="email"
          error={f.errors.email}
          readOnly={loading}
          {...f.bind('email')}
        />
        <Field
          id="ch-talk-monitors"
          as="select"
          label="Display Setup"
          className="ch-span2"
          error={f.errors.monitors}
          disabled={loading}
          {...f.bind('monitors')}
        >
          {MONITORS.map(m => (
            <option key={m}>{m}</option>
          ))}
        </Field>
        <Field
          id="ch-talk-topic"
          as="select"
          label="Preset Automation"
          className="ch-span2"
          error={f.errors.preset}
          disabled={loading}
          {...f.bind('preset')}
          onChange={e => {
            f.set('preset', e.target.value);
            setTalk(e.target.value);
          }}
        >
          <option value="">Select a preset…</option>
          {TALKS.map(t => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </Field>
        <Field
          id="ch-talk-msg"
          as="textarea"
          rows={3}
          label="Custom Notes or Resolution (optional)"
          className="ch-span2"
          readOnly={loading}
          {...f.bind('notes')}
        />
      </div>
      <div className="ch-form__foot">
        <p className="ch-note">Saves your target wallpaper schedule profile.</p>
        <button type="submit" className="ch-btn ch-btn--raised" aria-disabled={loading || undefined}>
          {loading ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            <>
              Save automation profile <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {loading ? 'Saving profile…' : ''}
      </p>
    </form>
  );
}

export default function Workshops() {
  const [fmt, setFmt] = useState('All');
  const [talk, setTalk] = useState('');
  const formRef = useRef(null);
  const reduce = useReduced();
  const list = fmt === 'All' ? TALKS : TALKS.filter(t => t.formats.includes(fmt));

  const request = id => {
    setTalk(id);
    const el = formRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => el.querySelector('#ch-talk-name')?.focus({ preventScroll: true }), reduce ? 0 : 450);
  };

  return (
    <section className="ch-section ch-speaking" id="automation" aria-labelledby="ch-speaking-title">
      <div className="ch-wrap ch-speak">
        <div className="ch-speak__main">
          <header className="ch-shead" data-reveal>
            <p className="ch-label">
              <GroupIcon size={15} /> Automation
            </p>
            <h2 className="ch-h2" id="ch-speaking-title">
              Schedules, solar elevation, and multi-display sync.
            </h2>
            <p className="ch-lede">
              Preset configurations crafted for Apple Silicon and multi-display setups. Filter by platform architecture, then configure your workspace schedule.
            </p>
          </header>

          <LayoutGroup id="ch-formats">
            <div className="ch-chips" role="group" aria-label="Filter presets by architecture" data-reveal>
              {FORMATS.map(c => {
                const on = c === fmt;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`ch-chip ${on ? 'is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => setFmt(c)}
                  >
                    {on && (
                      <motion.span
                        layoutId="ch-fmt-bg"
                        className="ch-chip__bg"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 420, damping: 36 }
                        }
                      />
                    )}
                    <span className="ch-chip__label">{c === 'All' ? 'All architectures' : c}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          <p className="sr-only" aria-live="polite">
            {`${list.length} ${list.length === 1 ? 'preset' : 'presets'} shown`}
          </p>

          <ol role="list" className="ch-talks">
            <AnimatePresence mode="popLayout" initial={false}>
              {list.map(t => {
                const n = TALKS.indexOf(t) + 1;
                return (
                  <motion.li
                    key={t.id}
                    layout={reduce ? false : 'position'}
                    className={`ch-talk ${talk === t.id ? 'is-picked' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                  >
                    <span className="ch-talk__num">0{n}</span>
                    <div className="ch-talk__body">
                      <h3 className="ch-talk__title">{t.title}</h3>
                      <p className="ch-talk__text">{t.text}</p>
                      <div className="ch-talk__foot">
                        <ul role="list" className="ch-tags" aria-label="Formats">
                          {t.formats.map(f => (
                            <li key={f} className={`ch-tag ${fmt === f ? 'is-match' : ''}`}>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="ch-textbtn ch-textbtn--strong"
                          onClick={() => request(t.id)}
                        >
                          {talk === t.id ? 'Active Preset' : 'Configure this preset'}
                          <span className="sr-only">: {t.title}</span>
                          {talk === t.id ? <CheckIcon size={15} /> : <ArrowRight size={15} />}
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </div>

        <aside className="ch-formcard" aria-label="Automation profile form" data-reveal>
          <RequestForm talk={talk} setTalk={setTalk} formRef={formRef} />
        </aside>
      </div>
    </section>
  );
}
