import { useEffect, useId, useRef, useState } from 'react';
import { Expand, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { applyImageFallback } from '../../config/imageConfig.js';
import { vehiclePhotos } from '../../utils/vehicleGallery.js';
import './VehicleGallery.css';

export function VehicleGallery({ v }) {
  return <Gallery key={v.id || v.slug || v.image || 'vehicle'} vehicle={v} />;
}

function Gallery({ vehicle }) {
  const photos = vehiclePhotos(vehicle);
  const [selectedId, setSelectedId] = useState(photos[0].id);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const touchStart = useRef(null);
  const titleId = useId();
  const index = Math.max(
    0,
    photos.findIndex((photo) => photo.id === selectedId),
  );
  const photo = photos[index];
  const multiple = photos.length > 1;
  const selectNext = (step) =>
    setSelectedId(photos[(index + step + photos.length) % photos.length].id);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const opener = openerRef.current;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  const image = (className) => (
    <img
      key={photo.url}
      className={className}
      src={photo.url}
      alt={`${vehicle.name} — ${photo.label}`}
      onError={applyImageFallback}
      decoding="async"
    />
  );
  return (
    <>
      <div className="detail-image">
        <div className="detail-image__visual">
          {image()}
          {vehicle.category && <span className="detail-image__category">{vehicle.category}</span>}
          <button
            ref={openerRef}
            type="button"
            className="detail-image__expand"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
          >
            <Expand size={16} aria-hidden="true" />
            View Larger
          </button>
        </div>
        {multiple && (
          <div className="detail-image__navigation">
            <div className="detail-image__photo-meta" aria-live="polite">
              <span>{photo.label}</span>
              <span>
                {index + 1} / {photos.length}
              </span>
            </div>
            <div className="detail-image__thumbnails" role="group" aria-label="Vehicle photos">
              {photos.map((item, itemIndex) => (
                <button
                  type="button"
                  key={item.id}
                  aria-label={`Show ${item.label}, photo ${itemIndex + 1} of ${photos.length}`}
                  aria-pressed={photo.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <img
                    key={item.url}
                    src={item.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={applyImageFallback}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        <span>Illustrative image · actual vehicle may differ</span>
      </div>
      <dialog
        ref={dialogRef}
        className="vehicle-image-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (!multiple) return;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            selectNext(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
      >
        <div className="vehicle-image-dialog__content">
          <div className="vehicle-image-dialog__header">
            <h2 id={titleId}>{vehicle.name}</h2>
            <button
              type="button"
              aria-label="Close larger image"
              onClick={() => setOpen(false)}
              autoFocus
            >
              <X size={21} aria-hidden="true" />
            </button>
          </div>
          {open && (
            <div
              className="vehicle-image-dialog__stage"
              onTouchStart={(event) => {
                const point = event.touches[0];
                touchStart.current =
                  event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
              }}
              onTouchCancel={() => {
                touchStart.current = null;
              }}
              onTouchEnd={(event) => {
                const start = touchStart.current;
                touchStart.current = null;
                if (!start || !multiple || !event.changedTouches.length) return;
                const point = event.changedTouches[0],
                  dx = point.clientX - start.x,
                  dy = point.clientY - start.y;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2)
                  selectNext(dx < 0 ? 1 : -1);
              }}
            >
              {image('vehicle-image-dialog__photo')}
              {multiple && (
                <>
                  <button
                    type="button"
                    className="vehicle-image-dialog__previous"
                    aria-label="Previous photo"
                    onClick={() => selectNext(-1)}
                  >
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="vehicle-image-dialog__next"
                    aria-label="Next photo"
                    onClick={() => selectNext(1)}
                  >
                    <ChevronRight size={22} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          )}
          <div className="vehicle-image-dialog__meta" aria-live="polite">
            <span>{photo.label}</span>
            <span>
              {index + 1} / {photos.length}
            </span>
          </div>
          <p>Illustrative image · actual vehicle may differ</p>
        </div>
      </dialog>
    </>
  );
}
