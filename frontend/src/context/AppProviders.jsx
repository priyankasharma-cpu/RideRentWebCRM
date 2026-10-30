import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { ShopProvider } from './ShopContext';
import { NotificationProvider } from './NotificationContext';
export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ShopProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </ShopProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
