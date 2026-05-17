'use client';

import { useState, useRef, useEffect } from 'react';
import { X, FileText, Folder } from 'lucide-react';

interface NewFileDialogProps {
  type: 'file' | 'folder';
  currentPath: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function NewFileDialog({ type, currentPath, onConfirm, onCancel, loading, error }: NewFileDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (/[\/\\]/.test(trimmed)) return; // 禁止路径分隔符
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            {type === 'folder' ? (
              <Folder className="w-5 h-5 text-blue-500" />
            ) : (
              <FileText className="w-5 h-5 text-[var(--primary)]" />
            )}
            <h3 className="font-semibold">{type === 'folder' ? '新建文件夹' : '新建文件'}</h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-[var(--accent)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5">
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            在 <span className="font-mono text-[var(--foreground)]">{currentPath}</span> 中创建
          </p>

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'folder' ? '文件夹名称' : '文件名（如 notes.txt）'}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
            disabled={loading}
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
