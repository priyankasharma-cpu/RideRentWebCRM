import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
export function useBooking(id, token) {
  const client = useQueryClient();
  const key = ['booking', id, token];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => bookingService.get(id, token, signal),
  });
  return {
    booking: query.data || null,
    fetchError: query.error?.message || '',
    setBooking: (value) => client.setQueryData(key, value),
  };
}
