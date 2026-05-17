'use client';

import { useEffect, useRef } from 'react';

export interface ActionSheetItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ActionSheetProps {
  items: ActionSheetItem[];
  onCancel: () => void;
  title?: string;
}

export function ActionSheet({ items, onCancel, title }: ActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  return (
    <div className="actionsheet-backdrop" onClick={onCancel}>
      <div
        ref={sheetRef}
        className="actionsheet"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-4 py-3 text-center text-sm text-[var(--muted-foreground)] border-b border-[var(--border)]">
            {title}
          </div>
        )}
        {items.map((item, i) => (
          <button
            key={i}
            className={`actionsheet-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              item.onClick();
              onCancel();
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        <button className="actionsheet-cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}
