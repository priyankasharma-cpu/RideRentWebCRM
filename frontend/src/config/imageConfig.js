export const imageConfig = {
  hero: {
    light: '/images/home/hero/hero-light.png',
    dark: '/images/home/hero/hero-dark.png',
  },
  categories: {
    bike: '/images/vehicles/bikes/fleet-road.jpg',
    scooter: '/images/vehicles/scooters/scooter.png',
    car: '/images/vehicles/cars/fleet-car.jpg',
    classic: '/images/vehicles/bikes/fleet-classic.jpg',
    duke: '/images/vehicles/bikes/fleet-bike.jpg',
  },
  fallback: '/images/vehicles/scooters/scooter.png',
};
export function applyImageFallback(event) {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = imageConfig.fallback;
}
