import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';
const ShopContext = createContext(null);
export function ShopProvider({ children }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['api', '/settings'],
    queryFn: ({ signal }) =>
      api('/settings', {
        signal,
      }),
  });
  const setConfig = (value) => client.setQueryData(['api', '/settings'], value);
  return (
    <ShopContext.Provider
      value={{
        config: query.data || null,
        setConfig,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
export const useShop = () => useContext(ShopContext);
