'use client';

import { useTheme } from 'next-themes';
import { FolderOpen, Sun, Moon, Monitor, Search, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchActive?: boolean;
  onSearchClose?: () => void;
}

export function Header({ onSearch, searchActive, onSearchClose }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSearchClick = () => {
    setShowSearch(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    onSearchClose?.();
  };

  // 同步外部 searchActive 状态
  useEffect(() => {
    if (searchActive) {
      setShowSearch(true);
    }
  }, [searchActive]);

  // Ctrl+K / Cmd+K 快捷键打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!showSearch) {
          handleSearchClick();
        }
      }
      if (e.key === 'Escape' && showSearch) {
        handleCloseSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  return (
    <header className="h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
      {showSearch ? (
        // 搜索模式
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
          <Search className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文件名或内容..."
            className="flex-1 bg-transparent text-sm sm:text-base outline-none placeholder:text-[var(--muted-foreground)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors touch-target"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleCloseSearch}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2 py-1 touch-target"
          >
            取消
          </button>
        </form>
      ) : (
        // 正常模式
        <>
          <div className="flex items-center gap-2 sm:gap-3">
            <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" />
            <h1 className="text-base sm:text-lg font-semibold">NAS 文件管理器</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors touch-target"
              title="搜索文件 (Ctrl+K)"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors touch-target"
              title={`当前: ${theme}`}
            >
              <ThemeIcon />
            </button>
          </div>
        </>
      )}
    </header>
  );
}
