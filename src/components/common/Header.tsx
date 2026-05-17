'use client';

import { useTheme } from 'next-themes';
import { FolderOpen, Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon = () => {
    if (!mounted) return <Monitor className="w-5 h-5" />;
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <header className="h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" />
        <h1 className="text-base sm:text-lg font-semibold">NAS 文件管理器</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors touch-target"
          title={`当前: ${theme}`}
        >
          <ThemeIcon />
        </button>
      </div>
    </header>
  );
}
