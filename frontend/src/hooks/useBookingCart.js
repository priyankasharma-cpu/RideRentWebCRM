import { useEffect, useState } from 'react';
import { defaultPeriod, periodFromParams } from '../utils/rentalTime.js';
import { rentalPeriodQuery, updateCartQuantity } from '../utils/bookingCart.js';
import { bookingConfig } from '../config/bookingConfig.js';

function initialDraft(params) {
  let stored = null;
  try {
    stored = JSON.parse(sessionStorage.getItem(bookingConfig.draftStorageKey));
  } catch {
    /* Storage may be unavailable. */
  }
  let remaining = bookingConfig.maxVehiclesPerCart;
  const items = [];
  const seen = new Set();
  for (const item of Array.isArray(stored?.items) ? stored.items : []) {
    if (
      typeof item?.key !== 'string' ||
      item.key.length > 100 ||
      seen.has(item.key) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      remaining === 0
    )
      continue;
    const quantity = Math.min(item.quantity, remaining);
    items.push({ key: item.key, quantity });
    seen.add(item.key);
    remaining -= quantity;
  }
  let period = stored?.period || defaultPeriod();
  if (params.has('startsAt') || params.has('endsAt')) period = periodFromParams(params);
  let error = '';
  try {
    rentalPeriodQuery(period, { future: true });
  } catch (problem) {
    error = problem.message;
    period = defaultPeriod();
  }
  const vehicle = params.get('vehicle');
  return { period, items: vehicle ? [{ key: vehicle, quantity: 1 }] : items, error };
}

export function useBookingCart(params) {
  const [initial] = useState(() => initialDraft(params));
  const [period, setPeriod] = useState(initial.period);
  const [appliedPeriod, setAppliedPeriod] = useState(initial.period);
  const [items, setItems] = useState(initial.items);
  const [scheduleError, setScheduleError] = useState(initial.error);
  const changed =
    period.startsAt !== appliedPeriod.startsAt || period.endsAt !== appliedPeriod.endsAt;
  useEffect(() => {
    try {
      sessionStorage.setItem(
        bookingConfig.draftStorageKey,
        JSON.stringify({ items, period: appliedPeriod }),
      );
    } catch {
      /* The cart still works without browser storage. */
    }
  }, [items, appliedPeriod]);
  function applySchedule(event) {
    event.preventDefault();
    try {
      rentalPeriodQuery(period, { future: true });
      setAppliedPeriod({ ...period });
      setScheduleError('');
      return { ...period };
    } catch (problem) {
      setScheduleError(problem.message);
      return null;
    }
  }
  return {
    period,
    setPeriod,
    appliedPeriod,
    items,
    changed,
    scheduleError,
    applySchedule,
    updateQuantity: (group, quantity) =>
      setItems((current) => updateCartQuantity(current, group, quantity)),
    remove: (key) => setItems((current) => current.filter((item) => item.key !== key)),
  };
}
