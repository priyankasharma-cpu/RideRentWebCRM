import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';
export function useResource(path, interval = 0) {
  const client = useQueryClient();
  const queryKey = ['api', path];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      api(path, {
        signal,
      }),
    refetchInterval: interval || false,
  });
  return {
    data: query.data ?? null,
    error: query.error?.message || '',
    loading: query.isPending,
    reload: async () => (await query.refetch()).data,
    setData: (value) => client.setQueryData(queryKey, value),
  };
}
