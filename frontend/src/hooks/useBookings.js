import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
export function useBooking(id, token, initialBooking) {
  const client = useQueryClient();
  const key = [initialBooking ? 'admin-booking' : 'booking', id, token];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => bookingService.get(id, token, signal),
    initialData: initialBooking,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  return {
    booking: query.data || null,
    fetchError: query.error?.message || '',
    setBooking: async (value) => {
      await client.cancelQueries({ queryKey: key, exact: true });
      client.setQueryData(key, value);
    },
  };
}
