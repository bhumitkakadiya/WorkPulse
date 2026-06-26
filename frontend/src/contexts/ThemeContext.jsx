import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, updatePreferences } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('wp_theme') || 'system');
  const [activeTheme, setActiveTheme] = useState('dark');

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('wp_theme', t);
    
    let resolvedTheme = t;
    if (t === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    
    setActiveTheme(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  };

  useEffect(() => {
    // localStorage is the source of truth for theme.
    // Only fall back to user.preferences.theme if the user has never set a theme locally.
    const stored = localStorage.getItem('wp_theme');
    if (stored) {
      applyTheme(stored);
    } else if (user?.preferences?.theme) {
      applyTheme(user.preferences.theme);
    } else {
      applyTheme(theme);
    }
  }, [user]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      if (theme === 'system') {
        const resolvedTheme = mediaQuery.matches ? 'light' : 'dark';
        setActiveTheme(resolvedTheme);
        document.documentElement.setAttribute('data-theme', resolvedTheme);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const toggleTheme = async () => {
    const next = (theme === 'dark' || activeTheme === 'dark') ? 'light' : 'dark';
    applyTheme(next);
    try { await updatePreferences({ theme: next }); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, activeTheme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
