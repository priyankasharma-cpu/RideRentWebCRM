import { authService } from '../services/authService';
import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loadSession, updateSessionCache, resetSessionCache } from '../services/apiClient';
const AuthContext = createContext(null);
const sessionKey = ['session'];
export function AuthProvider({ children }) {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: loadSession,
    staleTime: Infinity,
  });
  const login = async (values) => {
    const result = await authService.login(values);
    updateSessionCache(result);
    client.setQueryData(sessionKey, result);
    client.removeQueries({
      queryKey: ['api', '/admin'],
      exact: false,
    });
  };
  const logout = async () => {
    await authService.logout();
    resetSessionCache();
    client.removeQueries({
      predicate: (query) =>
        query.queryKey[0] === 'api' && String(query.queryKey[1]).startsWith('/admin'),
    });
    client.setQueryData(sessionKey, {
      user: null,
    });
    await loadSession();
  };
  return (
    <AuthContext.Provider
      value={{
        user: session.data?.user || null,
        ready: !session.isPending,
        authError: session.error?.message || '',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
