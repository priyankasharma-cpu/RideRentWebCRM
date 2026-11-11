import { imageConfig } from '../config/imageConfig.js';
const safeSource = (value) =>
  typeof value === 'string' && (/^\/images\/[^\\]*$/.test(value) || /^https:\/\//i.test(value));
export function vehiclePhotos(vehicle) {
  const seen = new Set();
  const photos = (Array.isArray(vehicle.images) ? vehicle.images : [])
    .filter((photo) => {
      if (!photo || !safeSource(photo.url) || seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    })
    .slice(0, 5)
    .map((photo, index) => ({
      id: `${index}-${photo.url}`,
      label:
        typeof photo.label === 'string' && photo.label.trim()
          ? photo.label.trim()
          : `Photo ${index + 1}`,
      url: photo.url,
    }));
  if (photos.length) return photos;
  return [
    {
      id: 'primary',
      label: 'Vehicle photo',
      url: safeSource(vehicle.image) ? vehicle.image : imageConfig.fallback,
    },
  ];
}
