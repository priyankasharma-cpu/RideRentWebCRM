import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('riderent-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );
  useEffect(() => {
    // The head bootstrap script applies the same token before React paints.
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('riderent-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((value) => (value === 'dark' ? 'light' : 'dark'));
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
