import { useEffect, useRef } from 'react';
import { isEmail } from '../shared/a11y.js';
import { CONTACT_TOPICS } from '../data.js';
import { required, useDemoForm } from '../lib.jsx';
import { ArrowRight, CheckIcon, MailIcon, Spinner, UndoIcon } from '../icons.jsx';
import Field from './Field.jsx';

const RULES = {
  name: required('your name'),
  email: v => (!v.trim() ? 'Please add your email.' : !isEmail(v) ? 'Enter a valid email, like name@example.com.' : ''),
  message: v => (!v.trim() ? 'Please include a message.' : v.trim().length < 10 ? 'A few more details — at least 10 characters.' : ''),
};

export default function Contact({ topic, setTopic }) {
  const f = useDemoForm({ name: '', email: '', message: '' }, RULES, { delay: 900 });
  const doneRef = useRef(null);
  const loading = f.status === 'loading';

  useEffect(() => {
    if (f.status === 'success') doneRef.current?.focus({ preventScroll: true });
  }, [f.status]);

  return (
    <section className="ch-section ch-contact-sec" id="contact" aria-labelledby="ch-contact-title">
      <div className="ch-wrap">
        <div className="ch-contact" data-reveal>
          <div className="ch-contact__intro">
            <p className="ch-label">
              <MailIcon size={15} /> Support &amp; Feedback
            </p>
            <h2 className="ch-h2" id="ch-contact-title">
              Request a feature or suggest a wallpaper.
            </h2>
            <p className="ch-lede">
              Have an aerial location you’d love to see or an automation workflow idea? Send a note directly to the developer.
            </p>
            <p className="ch-note">Your feedback directly shapes forthcoming releases.</p>
          </div>

          {f.status === 'success' ? (
            <div className="ch-contact__done">
              <span className="ch-donemark" aria-hidden="true">
                <CheckIcon size={20} />
              </span>
              <h3 className="ch-h3" tabIndex={-1} ref={doneRef}>
                Note received.
              </h3>
              <p role="status">Thank you for your feedback! It has been logged for the upcoming AuraLoop build.</p>
              <button type="button" className="ch-btn ch-btn--ghost" onClick={() => f.reset()}>
                <UndoIcon size={15} /> Send another note
              </button>
            </div>
          ) : (
            <form ref={f.formRef} noValidate onSubmit={f.onSubmit} className="ch-form ch-contact__form">
              <fieldset className="ch-topics">
                <legend className="ch-field__label">Topic</legend>
                <div className="ch-topics__opts">
                  {CONTACT_TOPICS.map(t => (
                    <label key={t} className={`ch-topic ${topic === t ? 'is-on' : ''}`}>
                      <input
                        type="radio"
                        name="topic"
                        value={t}
                        checked={topic === t}
                        onChange={() => setTopic(t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="ch-form__grid">
                <Field
                  id="ch-contact-name"
                  label="Name"
                  autoComplete="name"
                  error={f.errors.name}
                  readOnly={loading}
                  {...f.bind('name')}
                />
                <Field
                  id="ch-contact-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  error={f.errors.email}
                  readOnly={loading}
                  {...f.bind('email')}
                />
                <Field
                  id="ch-contact-msg"
                  as="textarea"
                  rows={4}
                  label="Message"
                  className="ch-span2"
                  error={f.errors.message}
                  readOnly={loading}
                  {...f.bind('message')}
                />
              </div>
              <div className="ch-form__foot">
                <p className="ch-note">Direct communication with Avdesh Jadon.</p>
                <button type="submit" className="ch-btn ch-btn--raised" aria-disabled={loading || undefined}>
                  {loading ? (
                    <>
                      <Spinner /> Sending…
                    </>
                  ) : (
                    <>
                      Send message <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
              <p className="sr-only" aria-live="polite">
                {loading ? 'Sending message…' : ''}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
