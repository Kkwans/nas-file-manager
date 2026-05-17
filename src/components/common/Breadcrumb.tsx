'use client';

import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
  actions?: React.ReactNode;
}

export function Breadcrumb({ path, onNavigate, actions }: BreadcrumbProps) {
  const segments = path.split('/').filter(Boolean);

  const buildPath = (index: number) => {
    return '/' + segments.slice(0, index + 1).join('/');
  };

  return (
    <nav className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 text-sm overflow-x-auto bg-[var(--card)] border-b border-[var(--border)] shrink-0">
      {actions && <div className="shrink-0 mr-1">{actions}</div>}
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded hover:bg-[var(--accent)] transition-colors shrink-0 touch-target"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">根目录</span>
      </button>

      {segments.map((segment, index) => (
        <div key={index} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--muted-foreground)]" />
          <button
            onClick={() => onNavigate(buildPath(index))}
            className="px-1.5 sm:px-2 py-1 rounded hover:bg-[var(--accent)] transition-colors truncate max-w-[100px] sm:max-w-[200px]"
            title={segment}
          >
            {segment}
          </button>
        </div>
      ))}
    </nav>
  );
}
