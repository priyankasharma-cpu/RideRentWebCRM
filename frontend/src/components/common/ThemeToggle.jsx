import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';
export function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  if (compact) {
    return (
      <button
        type="button"
        className="theme-toggle theme-toggle--capsule"
        data-theme={theme}
        aria-pressed={theme === 'dark'}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <span className="theme-toggle__track" aria-hidden="true">
          <span className="theme-toggle__indicator" />
          <Sun className="theme-toggle__sun" size={17} />
          <Moon className="theme-toggle__moon" size={17} />
        </span>
      </button>
    );
  }
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <Sun size={15} />
      <span className="toggle-knob">
        {theme === 'light' ? <Sun size={13} /> : <Moon size={13} />}
      </span>
      <Moon size={14} />
    </button>
  );
}
