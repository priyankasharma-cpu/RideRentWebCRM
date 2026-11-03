# Driving-animation assets

- bike.webp: black touring motorcycle with helmeted rider, 1536 × 1024.
- scooter.webp: Honda Activa style from the supplied reference, 1672 × 941.
- car.webp: Hyundai Avante N Line derivative, 1925 × 817.
- bike-wheel.webp and scooter-wheel.webp: standalone transparent photographic wheel textures, 512 × 512.

All images retain alpha transparency. Bike/scooter images are AI-assisted edits of the client's supplied references; wheel textures are matching AI-generated assets. The car derives from Damian B Oh's CC BY-SA 4.0 photograph. Preserve CREDITS.html and its visible section link when deploying.

## Editing

VehicleRoadAnimation.jsx contains canvas dimensions, wheel centers, wheel radii and stationary hardware paths. Wheel layers rotate beneath a masked photographic body. The masks remove original tyre pixels while preserving the fork, mudguard, exhaust and body panels. No CSS/SVG vehicle illustration is used. Changing an asset requires recalibrating these coordinates; replacing the file alone may misalign wheels. Mask clearance removes residual original tyre edges.

The car is mirrored to face right; its photographic rim overlays rotate in the opposite local direction so the on-screen direction matches the bike and scooter. Its transparent bottom padding is compensated in CSS.

VehicleRoadAnimation.css owns the section layout, light/dark tokens, periodic road/scenery tracks, suspension, shadows and wheel motion. No JavaScript frame loop or animation dependency is used. IntersectionObserver, page visibility, manual pause/play and reduced-motion preferences control playback. Arrow keys/Home/End operate the accessible category tabs. Each replacement image and wheel texture is decoded before crossfading, with a fixed stage height to avoid layout shifts.
