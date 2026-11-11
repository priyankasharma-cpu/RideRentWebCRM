import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { defaultPeriod, periodFromParams } from '../utils/rentalTime.js';

// URL is the schedule source of truth; browser history never competes with local date state.
export function useRentalPeriod() {
  const [params, setParams] = useSearchParams();
  const [initial] = useState(defaultPeriod);
  const missing = !params.has('startsAt') && !params.has('endsAt');
  const period = missing ? initial : periodFromParams(params);
  useEffect(() => {
    if (!missing) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('startsAt', initial.startsAt);
        next.set('endsAt', initial.endsAt);
        return next;
      },
      { replace: true },
    );
  }, [missing, initial, setParams]);
  const setPeriod = (nextPeriod) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('startsAt', nextPeriod.startsAt);
      next.set('endsAt', nextPeriod.endsAt);
      return next;
    });
  return { period, setPeriod };
}
