# Driving-animation assets

- bike.webp: Yamaha R15, 1614 × 975, transparent.
- scooter.webp: Honda Scoopy, 1583 × 994, transparent.
- car.webp: Hyundai Avante N Line, 1925 × 817, transparent.

See CREDITS.html for original photographers, source links, licenses and AI-assisted edit disclosure. Preserve the credit link and image licenses when deploying. These are modified photographic cutouts, not untouched product photographs.

Replace files with side profiles having transparent backgrounds, matching canvas dimensions and tire baseline. The car is mirrored in CSS to face right. Car rim positions in VehicleRoadAnimation.jsx are normalized to this exact asset; replacing car.webp requires updating or removing its rim layers. Bike/scooter independent wheel rotation is intentionally not simulated: forks and swingarms overlap their flattened wheel photographs.

Scene CSS contains scoped light/dark tokens, seamless repeated road/parallax tracks, suspension and contact shadows. CSS transforms animate without per-frame React updates. IntersectionObserver and page visibility pause motion; reduced-motion disables animation. Pause/play and keyboard tab navigation are supported.
