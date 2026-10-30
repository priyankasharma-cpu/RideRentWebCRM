import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { toUTC } from '../utils/rentalTime';
import { siteConfig } from '../config/siteConfig';
export function useQuote(vehicleId, period) {
  const [debounced, setDebounced] = useState(period);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(period), siteConfig.quoteDebounceMs);
    return () => clearTimeout(timer);
  }, [period]);
  const settling = period.startsAt !== debounced.startsAt || period.endsAt !== debounced.endsAt;
  const query = useQuery({
    queryKey: ['quote', vehicleId, debounced.startsAt, debounced.endsAt],
    enabled: Boolean(vehicleId),
    staleTime: 0,
    queryFn: ({ signal }) =>
      bookingService.quote(
        {
          vehicleId,
          startsAt: toUTC(debounced.startsAt),
          endsAt: toUTC(debounced.endsAt),
        },
        signal,
      ),
  });
  return {
    quote: settling ? null : query.data || null,
    quoteError: settling ? '' : query.error?.message || '',
  };
}
