import { defaultVehicleFilters } from '../config/vehicleFilterConfig.js';
export function filterVehicles(vehicles, filters, hasRentalPeriod = false) {
  const query = filters.query.trim().toLocaleLowerCase();
  return vehicles.filter(
    (v) =>
      (filters.category === 'All' || v.category === filters.category) &&
      v.name.toLocaleLowerCase().includes(query) &&
      (filters.fuel === 'All' || v.fuel === filters.fuel) &&
      (filters.trans === 'All' || v.transmission === filters.trans) &&
      // API rates are paise; slider values are rupees per hour.
      v.rate <= filters.max * 100 &&
      (!filters.onlyAvailable ||
        (hasRentalPeriod ? v.available === true : v.physicalStatus === 'Available')),
  );
}
export function sortVehicles(vehicles, sort) {
  const result = [...vehicles];
  const compare = {
    low: (a, b) => a.rate - b.rate,
    high: (a, b) => b.rate - a.rate,
    'name-asc': (a, b) => a.name.localeCompare(b.name),
    'name-desc': (a, b) => b.name.localeCompare(a.name),
  };
  // No recommendation score exists. Keep the deterministic API order.
  return compare[sort] ? result.sort(compare[sort]) : result;
}
export function activeVehicleFilters(filters) {
  const chips = [];
  if (filters.query.trim()) chips.push({ key: 'query', label: `Search: ${filters.query.trim()}` });
  for (const key of ['category', 'trans', 'fuel'])
    if (filters[key] !== 'All') chips.push({ key, label: filters[key] });
  if (filters.max !== defaultVehicleFilters.max)
    chips.push({ key: 'max', label: `Up to ₹${filters.max}/hour` });
  if (filters.onlyAvailable) chips.push({ key: 'onlyAvailable', label: 'Available only' });
  return chips;
}
