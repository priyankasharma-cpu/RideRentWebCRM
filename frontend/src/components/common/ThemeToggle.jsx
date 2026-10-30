import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
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
