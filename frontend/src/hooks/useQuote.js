import { bookingService } from '../services/bookingService.js';
import { validateRentalPeriod } from '../utils/rentalTime.js';
import { useFreshQuote } from './useFreshQuote.js';

export function useQuote(vehicleId, period) {
  const { window, error } = validateRentalPeriod(period);
  const result = useFreshQuote(
    'quote',
    { vehicleId, ...window },
    Boolean(vehicleId && window),
    bookingService.quote,
  );
  return {
    quote: result.quote,
    quoteError: error || result.error,
    quoteLoading: result.loading,
    retryQuote: result.retry,
    canRetryQuote: Boolean(vehicleId && window),
  };
}
