import { useRef, useState } from 'react';
import { contactService } from '../../services/contactService.js';
import { Send, Info, UserRound, Mail, Phone, ListFilter, MessageSquare } from 'lucide-react';
import './ContactForm.css';
import { ContactSuccess } from './ContactSuccess.jsx';

export function ContactForm() {
  const submissionKey = useRef(crypto.randomUUID());
  const inFlight = useRef(false);
  const submitButtonRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [receipt, setReceipt] = useState(null);
  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    inFlight.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const values = Object.fromEntries(new FormData(form));
      const result = await contactService.submit({
        ...values,
        submissionKey: submissionKey.current,
      });
      setFeedback({
        type: 'success',
        text: `Message received. Your reference is ${result.id}. Our team can now view your inquiry.`,
      });
      setReceipt(result.id);
      form.reset();
      submissionKey.current = crypto.randomUUID();
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <form
        className="contact-form"
        aria-label="Contact inquiry"
        aria-busy={busy}
        onSubmit={submit}
      >
        <div className="contact-form__heading">
          <p>START A CONVERSATION</p>
          <h2>Tell us about your ride.</h2>
          <span>Vehicle, booking or pickup questions — start here.</span>
        </div>
        {feedback && (
          <div
            className={`contact-form__notice contact-form__notice--${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            <Info size={20} aria-hidden="true" />
            <p>{feedback.text}</p>
          </div>
        )}
        <fieldset className="contact-form__fieldset" disabled={busy}>
          <div className="contact-form__fields">
            <label>
              Full Name <span>(required)</span>
              <span className="contact-form__control">
                <UserRound size={17} aria-hidden="true" />
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Your full name"
                />
              </span>
            </label>
            <label>
              Email <span>(required)</span>
              <span className="contact-form__control">
                <Mail size={17} aria-hidden="true" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                />
              </span>
            </label>
            <label>
              Phone <span>(optional)</span>
              <span className="contact-form__control">
                <Phone size={17} aria-hidden="true" />
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={25}
                  pattern={String.raw`[+0-9\(\) .\-]{7,25}`}
                  placeholder="Your contact number"
                />
              </span>
            </label>
            <label>
              Inquiry Type <span>(required)</span>
              <span className="contact-form__control">
                <ListFilter size={17} aria-hidden="true" />
                <select name="inquiryType" defaultValue="" required>
                  <option value="" disabled>
                    Select an inquiry type
                  </option>
                  <option value="vehicle">Choosing a vehicle</option>
                  <option value="booking">Existing booking</option>
                  <option value="pickup">Pickup and return</option>
                  <option value="other">Other question</option>
                </select>
              </span>
            </label>
            <label className="contact-form__message">
              Message <span>(required)</span>
              <span className="contact-form__control contact-form__control--message">
                <MessageSquare size={17} aria-hidden="true" />
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={4}
                  placeholder="Tell us how we can help…"
                />
              </span>
            </label>
          </div>
        </fieldset>
        <div className="contact-form__footer">
          <button ref={submitButtonRef} type="submit" disabled={busy}>
            <Send size={17} aria-hidden="true" />
            {busy ? 'Sending…' : 'Send Message'}
          </button>
        </div>
      </form>
      {receipt && (
        <ContactSuccess
          returnFocusRef={submitButtonRef}
          reference={receipt}
          onClose={() => setReceipt(null)}
        />
      )}
    </>
  );
}
