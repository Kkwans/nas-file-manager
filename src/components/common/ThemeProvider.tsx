'use client';

import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { ReactNode, useEffect, useCallback } from 'react';

/** Updates <meta name="theme-color"> to match current theme */
function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }, [resolvedTheme]);

  return null;
}

/**
 * Adds a brief CSS transition class during theme switch for smooth color change.
 * The class is removed after 200ms to avoid affecting other animations.
 */
function ThemeTransitionEnabler() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 250);
    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ThemeColorUpdater />
      <ThemeTransitionEnabler />
      {children}
    </NextThemeProvider>
  );
}
