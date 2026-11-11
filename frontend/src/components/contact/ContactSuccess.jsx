import { useEffect, useId, useRef } from 'react';
import { CircleCheck, X } from 'lucide-react';
import './ContactSuccess.css';

export function ContactSuccess({ reference, onClose, returnFocusRef }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = returnFocusRef?.current || document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [returnFocusRef]);
  return (
    <dialog
      ref={dialogRef}
      className="contact-success"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="contact-success__content">
        <button
          type="button"
          className="contact-success__close"
          aria-label="Close thank you message"
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
        <span className="contact-success__icon">
          <CircleCheck size={36} aria-hidden="true" />
        </span>
        <h2 id={titleId}>Thank you!</h2>
        <p id={descriptionId}>
          Your message has been submitted successfully. The RideRent team has received your inquiry.
        </p>
        <div className="contact-success__reference">
          <span>Your reference</span>
          <strong>{reference}</strong>
        </div>
        <button type="button" className="contact-success__done" onClick={onClose}>
          Got it
        </button>
      </div>
    </dialog>
  );
}
