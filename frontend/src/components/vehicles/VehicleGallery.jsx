import { useEffect, useId, useRef, useState } from 'react';
import { Expand, X } from 'lucide-react';
import { applyImageFallback } from '../../config/imageConfig.js';
import './VehicleGallery.css';

export function VehicleGallery({ v }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector('button')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div className="detail-image">
        <div className="detail-image__visual">
          <img src={v.image} alt={v.name} onError={applyImageFallback} decoding="async" />
          {v.category && <span className="detail-image__category">{v.category}</span>}
          <button
            type="button"
            className="detail-image__expand"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
          >
            <Expand size={16} aria-hidden="true" />
            View Larger
          </button>
        </div>
        <span>Illustrative image · actual vehicle may differ</span>
      </div>
      <dialog
        ref={dialogRef}
        className="vehicle-image-dialog"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault();
            dialogRef.current.querySelector('button')?.focus();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="vehicle-image-dialog__content">
          <div className="vehicle-image-dialog__header">
            <h2 id={titleId}>{v.name}</h2>
            <button
              type="button"
              aria-label="Close larger image"
              onClick={() => setOpen(false)}
              autoFocus
            >
              <X size={21} aria-hidden="true" />
            </button>
          </div>
          {open && <img src={v.image} alt={v.name} onError={applyImageFallback} decoding="async" />}
          <p>Illustrative image · actual vehicle may differ</p>
        </div>
      </dialog>
    </>
  );
}
