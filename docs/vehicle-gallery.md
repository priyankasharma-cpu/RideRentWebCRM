# Vehicle photo gallery

The active application uses MongoDB. This feature preserves the existing detail-page image dimensions (380/320/310/250px), main `cover` image, legacy `image` property and booking/rental fields. Previous SQLite/Prisma notes in this document are historical only.

## Frontend

`frontend/src/components/vehicles/VehicleGallery.jsx` uses `frontend/src/utils/vehicleGallery.js` to normalize an optional `images` array. Up to five distinct URLs are accepted; invalid/duplicate URLs are ignored. If none exist, the existing `image` is used, then `imageConfig.fallback`. No angles or extra photos are invented. Existing photos must be supplied by the operator with truthful labels.

Each record can return:

```json
{
  "image": "/images/vehicles/example/front.webp",
  "images": [
    { "id": "front", "label": "Front 3/4 View", "url": "/images/vehicles/example/front.webp" },
    { "id": "side", "label": "Side Profile", "url": "/images/vehicles/example/side.webp" }
  ]
}
```

Suggested labels are Front 3/4 View, Side Profile, Rear 3/4 View, Dashboard / Handlebar, and Interior / Seats (cars) or Seat / Storage / Details (two-wheelers). Supply the real photos; labels do not generate images.

Thumbnail navigation appears only for multiple photos. Native dialog supports arrows, keyboard Left/Right, Escape, backdrop click and horizontal touch swipe. Native focus management replaces the previous custom Tab trap. Body scroll is restored and the View Larger button regains focus when closed. Selected image resets when vehicle identity changes. Broken sources use the existing fallback utility; keyed images allow error handling to work again on a new source.

## Persistence and deployment

The MongoDB backend stores gallery entries in `vehicle_images`, indexed by vehicle and ordered position. Existing vehicle documents and booking/payment fields are unchanged.

The MongoDB repository returns `images: []` when a vehicle has no gallery entries; gallery writes use the dedicated backend route and runtime indexes.

Deployment by the operator:

1. Confirm the API is connected to the intended MongoDB database.
2. Check `/readyz` and confirm database readiness.
3. Confirm GET `/api/vehicles/:slug` and existing bookings work before publishing gallery updates.

## Existing admin integration

A backward-compatible endpoint is registered in vehicle.routes.js:

`PUT /api/admin/vehicles/:id/images`

Requires the existing authenticated **admin** role and CSRF token. It uses vehicleGalleryInput validation, updateVehicleGallery service, repository transaction and audit log. Body is `{ "images": [...] }`. The complete supplied array is the desired order (0–5 entries).

- Add: upload using the existing protected `POST /api/admin/uploads` (`image` multipart field), then add the returned URL to the array.
- Existing upload validation is unchanged: one file per request, 4 MiB, JPEG/PNG/WebP signatures. Call it up to five times; a new storage provider/batch upload service was not added.
- Primary: move an entry to position 0. The service also sets legacy `vehicles.image` to that URL so existing listing cards remain compatible.
- Replace: update an entry's URL and send the full desired array.
- Remove/reorder: remove/reorder array entries and send the full desired array.
- Empty array removes gallery rows and keeps the previous legacy primary image. Uploaded files are not automatically deleted because another record may use them.
- Maximum five images; unique IDs and URLs, bounded non-empty labels, local `/images/` paths or HTTPS URLs only. No data/javascript URLs or credentials in external URLs.
- Gallery updates cannot change rate, deposit, physical status, odometer, booking dates or payment data. Existing vehicle-editor PUT requests do not erase gallery rows.

The existing admin VehicleEditor UI has **not** been redesigned into a five-photo manager. This endpoint and model prepare that future UI; staff can integrate them using the existing api client/CSRF handling. Do not send image arrays through the existing vehicle PUT expecting storage: use the dedicated images endpoint.

## Files

Frontend: VehicleGallery.jsx/.css, utils/vehicleGallery.js.
Backend: vehicleGallery.repository.js, vehicleGallery.validation.js, vehicleGallery.service.js; existing vehicle.presenter.js, vehicle.controller.js, vehicle.routes.js; MongoDB collection indexes are in `backend/src/config/mongoDatabase.js`.
Tests: prior SQLite integration coverage is preserved in `archive/legacy-prisma-sqlite/`; MongoDB-backed verification requires a configured isolated database. Browser fixture assets exercise navigation only; they are not published as real angles of a vehicle.

## Verification limits

Current vehicle records have no operator-supplied five-angle arrays. The production UI correctly stays in single-image mode until real photos are configured. Chromium desktop/mobile viewport and synthetic touch checks do not substitute for physical Android/iOS device testing.
