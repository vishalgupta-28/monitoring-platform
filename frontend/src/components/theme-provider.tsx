'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = window.localStorage.getItem('pulseboard-theme') as Theme | null;
    const nextTheme = saved ?? 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        window.localStorage.setItem('pulseboard-theme', nextTheme);
        document.documentElement.dataset.theme = nextTheme;
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={context.toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-subtle transition hover:border-signal/50 hover:text-white"
    >
      {context.theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      {context.theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
