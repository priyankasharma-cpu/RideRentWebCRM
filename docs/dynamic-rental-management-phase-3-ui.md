# Dynamic rental management — Admin Helmets and Add-ons UI

Completed in this step: the Helmets/Add-ons management portion of Phase 3. This does not mean the entire dynamic-platform roadmap is complete.

## Open and use

1. Sign in with the existing Admin account.
2. Open `/admin/helmets` for dedicated helmet settings, or `/admin/addons` for the full catalogue. Both appear in the Admin sidebar and are hidden from non-admin staff.
3. Choose **Configure Helmets** or **Add Add-on**. No real prices/stock are prefilled.
4. Enter the name, permanent unique code, rental price in rupees, per-booking/per-hour billing, real total stock, damaged/unavailable stock and maximum quantity per checkout.
5. Select eligible categories. For each category, enter the included/free quantity per physical vehicle. Included units consume stock and count towards the configured checkout maximum.
6. Enable rentals and save. The existing protected API persists settings in SQLite. Newly calculated customer quotes use the saved configuration; confirmed bookings retain their historical snapshots.
7. Use **Pause/Enable** to temporarily stop/restart new rentals. Existing bookings are preserved.
8. Use search and status filters to find current, enabled, paused or archived items.
9. Archive discontinued generic add-ons only when they will not be needed again. Confirmation explicitly states that the code cannot be reused and history remains. Helmets use Pause instead: the reserved `helmet` code must remain available for future configuration. The UI intentionally does not offer irreversible helmet archiving.

Amounts are converted from a validated decimal string to integer paise, preserving two-decimal input without relying on floating-point multiplication. The backend remains authoritative and enforces all bounds, category rules, version conflicts and stock commitments.

The editor allows an optional local/HTTPS image URL. New upload services were not introduced. Broader image/gallery management remains a separate planned task.

## Inventory display

Each card shows total stock, unavailable stock, peak future reservations, active/inspecting rental allocations, minimum future availability and the checkout quantity cap. These descriptions match the existing conservative backend summary. This is not an equipment-scanning/partial issue-return interface. The page explains that independent equipment workflows are still pending.

The two routes reuse the same page/editor/service; helmet pricing logic is not duplicated. Existing Admin layout, theme toggle, notifications, search control, modal and API client are reused. Protected routes and sidebar filtering both enforce Admin-only presentation; the backend additionally enforces the actual permissions.

## Files created

- `frontend/src/admin/pages/AddOnManagement.jsx`
- `frontend/src/admin/pages/AddOnManagement.css`
- `frontend/src/admin/pages/HelmetManagement.jsx` (dedicated route reusing the shared page)
- `frontend/src/admin/features/addons/AddOnEditor.jsx`
- `frontend/src/admin/features/addons/AddOnEditor.css`
- `frontend/src/services/addOnService.js`
- `backend/tests/e2e/admin-addons.mjs`
- This document.

## Files modified

- `frontend/src/admin/routes.jsx`: lazy-loaded, role-protected routes.
- `frontend/src/config/adminNavigation.js`: Helmets/Add-ons navigation.
- `frontend/src/admin/components/AdminSidebar.jsx`: new entries hidden from staff.

No backend business code, schema or migration was changed in this UI step. No dependency was installed and no file was deleted. Existing shop/preview records were not seeded or updated; tests used a disposable database and temporary accounts.

## Future customization

- Form fields, labels, category controls: `admin/features/addons/AddOnEditor.jsx`.
- Form spacing and mobile width: `AddOnEditor.css`. The viewport-width constraint is scoped to the modal containing this editor, so other shared dialogs are unaffected.
- Cards, inventory labels, search/status filters and actions: `admin/pages/AddOnManagement.jsx` and its CSS.
- Navigation order/labels: `config/adminNavigation.js`.
- Server calls: `services/addOnService.js`; it uses the existing session cookie/CSRF API client.
- Validation/stock rules: existing `backend/src/modules/addons/`; do not replace backend validation with frontend-only checks.

If another Admin edits the same item, saving the stale editor returns a version-conflict error. Close it and reopen the refreshed item before saving again. Server errors remain visible in the editor/page. A failed create cannot overwrite an existing code.

## Verification

Commands:

```text
npm run lint
npm run build
node backend/tests/e2e/admin-addons.mjs
node --test backend/tests/integration/addons.test.js backend/tests/integration/checkout.test.js
```

The browser runner requires a current frontend build, launches installed Microsoft Edge through the existing Playwright package, and creates/removes its own isolated database. It never writes test records to the running shop/preview database.

Browser coverage executed successfully:

- Real Admin sign-in and dedicated Helmets route.
- Create/save/reload configuration through the actual API.
- Category validation and included units.
- Decimal-price persistence (₹50.25 stored as 5025 paise).
- Customer checkout reflecting Admin rate/billing changes, including hourly helmet totals.
- Pause/Enable affecting customer availability.
- Generic add-on creation, search/status filters and archive accept/cancel.
- Archived items read-only and historical records retained.
- Stale editor rejected after a concurrent version update.
- Escape dismissal and focus restoration.
- Staff redirected away from restricted routes; sidebar entries hidden.
- Page and editor checked at 1440, 1024, 768, 390 and 320px in light and dark modes, without horizontal overflow or an oversized dialog.
- No runtime page errors observed.

The browser test initially exposed a mobile modal-width issue; the new editor now has a viewport-based width constraint. Test selectors were also adjusted for existing implicit select labels and the shared currency formatter's trailing-zero behavior, then the complete browser flow was rerun successfully.

Screenshots are in `backend/.artifacts/admin-addons/<width>-<theme>.png`; their rates and stock are test fixtures only. They do not represent the real shop configuration.

## Still pending in the broader roadmap

Stable catalogue-model/physical-unit mapping, expanded vehicle gallery editor, independent equipment issue/return and adjustment events, configurable discounts/versioned vehicle-specific rental rules, manual multi-vehicle/add-on booking parity, a generic customer add-on picker, and any authenticated customer dashboard. Existing vehicle rates/deposits and basic shop rules remain editable through their existing Admin screens.
