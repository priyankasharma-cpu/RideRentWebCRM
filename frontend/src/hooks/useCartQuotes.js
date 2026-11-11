import { useQueries } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService.js';
import { toUTC } from '../utils/rentalTime.js';
import { sumVehicleQuotes } from '../utils/bookingCart.js';

export function useCartQuotes(vehicles, period, enabled) {
  const results = useQueries({
    queries: vehicles.map((vehicle) => ({
      queryKey: [
        'cart-quote',
        vehicle.id,
        vehicle.rate,
        vehicle.deposit,
        period.startsAt,
        period.endsAt,
      ],
      enabled,
      retry: false,
      queryFn: ({ signal }) =>
        bookingService.quote(
          { vehicleId: vehicle.id, startsAt: toUTC(period.startsAt), endsAt: toUTC(period.endsAt) },
          signal,
        ),
    })),
  });
  const pending = enabled && results.some((result) => result.isPending || result.isFetching);
  const error = enabled
    ? results.find((result) => result.error)?.error?.message ||
      results.find((result) => result.data?.available === false)?.data?.reason ||
      ''
    : '';
  const ready =
    enabled &&
    vehicles.length > 0 &&
    !pending &&
    !error &&
    results.every((result) => result.isSuccess && result.data.available === true);
  let total = null,
    totalError = '';
  if (ready) {
    try {
      total = sumVehicleQuotes(results.map((result) => result.data));
    } catch (problem) {
      totalError = problem.message;
    }
  }
  return {
    pending,
    error: error || totalError,
    ready: ready && !totalError,
    total,
    lines:
      ready && !totalError
        ? vehicles.map((vehicle, index) => ({ vehicle, quote: results[index].data }))
        : [],
  };
}
