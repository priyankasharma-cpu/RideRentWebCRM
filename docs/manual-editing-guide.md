# Manual editing guide

## Homepage text

Open frontend/src/config/homeContent.js for hero text, section headings, steps and CTA labels. FAQ entries live in faqContent.js. General information page content lives in pageContent.js. Keep object keys unchanged when editing text.

## Images

Replace files under frontend/public/images/home/hero for hero backgrounds. Central paths are in frontend/src/config/imageConfig.js. Category artwork lives under images/vehicles/bikes, scooters and cars. Keep filenames or update imageConfig. Legacy image aliases remain available because existing vehicle database records reference them. Actual rental vehicle photos are edited through Admin → Vehicles, not marketing configuration.

## Colors and section CSS

Edit semantic variables in frontend/src/styles/variables.css, light-theme.css and dark-theme.css. Each homepage section has matching JSX and CSS in components/home. For example HeroSection.css controls the hero. Preserve cascade layers and scoped class names. Check both themes and mobile after edits.

## Section order and new pages

Reorder imported sections in frontend/src/pages/Home.jsx. Add a customer page under pages, register it in routes.jsx and add navigation in config/navigation.js where needed. Use the existing lazy route pattern.

## Phone and shop details

Change the business phone through Admin → Settings; shop data comes from the API. siteConfig.js provides the fallback phone before shop configuration loads. Keep its tel and display values consistent. Footer and fallback branding configuration also live there; inspect the Logo component for visual wordmark changes.

## Vehicles and rental rates

Use Admin → Vehicles to add or edit a vehicle, image, hourly rate and deposit. Check availability and maintenance before accepting a reservation. Rates are authoritative in the database; existing bookings retain their historical rates. Do not edit homepage code to change actual rental prices.

## Admin dashboard

Dashboard.jsx composes admin/components and features/dashboard. Chart and analytics components live in features/analytics. Edit the matching component CSS; keep API calculations in backend services. Run npm run verify after changing booking or admin workflows.
