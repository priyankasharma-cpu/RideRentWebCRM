import { toUTC } from './rentalTime.js';
import { bookingConfig } from '../config/bookingConfig.js';

export function rentalPeriodQuery(period, { future = false } = {}) {
  const startsAt = toUTC(period.startsAt),
    endsAt = toUTC(period.endsAt);
  if (new Date(endsAt) <= new Date(startsAt)) throw Error('Return time must be after pickup.');
  if (future && new Date(startsAt).getTime() < Date.now() - 60000)
    throw Error('Choose a pickup time in the future.');
  return '?' + new URLSearchParams({ startsAt, endsAt });
}

export function groupBookingVehicles(vehicles) {
  const groups = new Map(),
    seen = new Set();
  for (const vehicle of vehicles) {
    if (seen.has(vehicle.id)) continue;
    seen.add(vehicle.id);
    // Never infer multiple inventory units from display names.
    const key = vehicle.modelId || vehicle.id;
    if (!groups.has(key))
      groups.set(key, {
        key,
        name: vehicle.modelName || vehicle.name,
        category: vehicle.category,
        image: vehicle.image,
        units: [],
      });
    groups.get(key).units.push(vehicle);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    availableUnits: group.units
      .filter((vehicle) => vehicle.available === true)
      .sort((a, b) => a.id.localeCompare(b.id)),
    minimumRate: Math.min(
      ...(group.units.some((vehicle) => vehicle.available === true)
        ? group.units.filter((vehicle) => vehicle.available === true)
        : group.units
      ).map((vehicle) => vehicle.rate),
    ),
  }));
}

export function cartLines(items, groups) {
  return items.map((item) => {
    const group = groups.find(
      (group) => group.key === item.key || group.units.some((unit) => unit.id === item.key),
    );
    return {
      ...item,
      group,
      available: Boolean(group && group.availableUnits.length >= item.quantity),
      vehicles: group ? group.availableUnits.slice(0, item.quantity) : [],
    };
  });
}

export function updateCartQuantity(items, group, quantity) {
  const matches = (item) =>
    item.key === group.key || group.units.some((unit) => unit.id === item.key);
  const current = items.filter(matches).reduce((sum, item) => sum + item.quantity, 0);
  const others = items.filter((item) => !matches(item));
  const capacity =
    bookingConfig.maxVehiclesPerCart - others.reduce((sum, item) => sum + item.quantity, 0);
  if (!Number.isInteger(quantity) || quantity < 0) return items;
  if (quantity > current && (quantity > group.availableUnits.length || quantity > capacity))
    return items;
  return quantity === 0 ? others : [...others, { key: group.key, quantity }];
}

export function sumVehicleQuotes(quotes) {
  const result = {
    base: 0,
    tax: 0,
    deposit: 0,
    total: 0,
    hours: quotes[0]?.hours || 0,
    roundingMinutes: quotes[0]?.roundingMinutes,
  };
  for (const quote of quotes) {
    if (quote.hours !== result.hours || quote.roundingMinutes !== result.roundingMinutes)
      throw Error('The rental quotes use different billing rules. Refresh availability.');
    for (const key of ['base', 'tax', 'deposit', 'total']) {
      if (
        !Number.isSafeInteger(quote[key]) ||
        quote[key] < 0 ||
        !Number.isSafeInteger(result[key] + quote[key])
      )
        throw Error('The rental quote contains an invalid amount.');
      result[key] += quote[key];
    }
  }
  return result;
}
