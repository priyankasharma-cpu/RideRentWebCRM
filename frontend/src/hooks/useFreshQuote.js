import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { siteConfig } from '../config/siteConfig.js';

export function useFreshQuote(key, input, enabled, request) {
  const payload = JSON.stringify(input);
  const [debounced, setDebounced] = useState(payload);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(payload), siteConfig.quoteDebounceMs);
    return () => clearTimeout(timer);
  }, [payload]);
  const settling = payload !== debounced;
  const query = useQuery({
    queryKey: [key, debounced],
    enabled: enabled && !settling,
    queryFn: ({ signal }) => request(JSON.parse(debounced), signal),
    staleTime: 0,
    retry: false,
  });
  const ready = enabled && !settling && query.isSuccess && !query.isFetching;
  return {
    quote: ready ? query.data : null,
    error: enabled && !settling ? query.error?.message || '' : '',
    loading: enabled && (settling || query.isPending || query.isFetching),
    retry: () => {
      if (enabled && !settling) return query.refetch();
    },
  };
}
