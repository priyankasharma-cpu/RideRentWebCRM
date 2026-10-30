import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { useNotifications } from '../context/NotificationContext';

// Compatibility facade keeps existing workflow consumers stable during extraction.
export function useApp() {
  return {
    ...useTheme(),
    ...useAuth(),
    ...useShop(),
    ...useNotifications(),
  };
}
