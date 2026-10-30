import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { siteConfig } from '../config/siteConfig';
function result(query) {
  return {
    data: query.data ?? null,
    error: query.error?.message || '',
    loading: query.isPending,
  };
}
export function useVehicles(query = '') {
  return result(
    useQuery({
      queryKey: ['api', `/vehicles${query}`],
      queryFn: ({ signal }) => vehicleService.list(query, signal),
      refetchInterval: siteConfig.pollingInterval,
    }),
  );
}
export function useVehicle(identifier) {
  return result(
    useQuery({
      queryKey: ['api', `/vehicles/${identifier}`],
      queryFn: ({ signal }) => vehicleService.get(identifier, signal),
      refetchInterval: siteConfig.pollingInterval,
    }),
  );
}
