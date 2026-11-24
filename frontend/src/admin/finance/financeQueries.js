import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../hooks/useApp.js';
import { api } from '../../services/apiClient.js';
import { base, searchParams } from './financeModel.js';

export const financeKey = ['api', base];
export function useFinance(endpoint, params = {}, enabled = true) {
  const { user } = useApp();
  const query = searchParams(params);
  return useQuery({
    queryKey: [...financeKey, user?.id, endpoint, query],
    queryFn: ({ signal }) => api(base + endpoint + (query ? '?' + query : ''), { signal }),
    enabled: enabled && user?.role === 'admin',
    staleTime: 15_000,
    gcTime: 90_000,
  });
}
export function useFinanceMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ path, body, method = 'POST' }) => api(base + path, { method, body }),
    onSuccess: async () => {
      await client.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'api' &&
          /^\/admin\/(finance|bookings|payments|dashboard)(?:\/|$)/.test(query.queryKey[1]),
      });
    },
  });
}
