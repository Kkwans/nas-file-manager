'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Pencil, AlertCircle } from 'lucide-react';

interface RenameDialogProps {
  /** Current full file name (e.g. "readme.md") */
  currentName: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Callback when user confirms rename */
  onConfirm: (newName: string) => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Whether the rename operation is in progress */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
}

export function RenameDialog({
  currentName,
  isDirectory,
  onConfirm,
  onCancel,
  loading = false,
  error = null,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const [selectionStart, setSelectionStart] = useState<number | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select filename (without extension) on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (!isDirectory && currentName.includes('.')) {
        // Select everything except the extension
        const dotIndex = currentName.lastIndexOf('.');
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [currentName, isDirectory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) return;
    if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('\0')) return;
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed !== currentName && !trimmed.includes('/') && !trimmed.includes('\\') && !trimmed.includes('\0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold">
              {isDirectory ? '重命名文件夹' : '重命名文件'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-[var(--accent)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4">
          <label className="block text-sm text-[var(--muted-foreground)] mb-2">
            {isDirectory ? '文件夹名称' : '文件名称'}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder={isDirectory ? '输入文件夹名称' : '输入文件名（含扩展名）'}
            disabled={loading}
          />

          {/* Hint */}
          {!isDirectory && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              💡 修改扩展名会改变文件类型（如 .txt → .md）
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md border border-[var(--border)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '重命名中...' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
