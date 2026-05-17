'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Folder, ArrowLeft, Loader2, Copy, Move } from 'lucide-react';
import { FileInfo } from '@/types';

interface FolderPickerDialogProps {
  title: string;
  mode: 'copy' | 'move';
  sourceName: string;
  currentPath: string;
  onConfirm: (targetDir: string) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function FolderPickerDialog({
  title,
  mode,
  sourceName,
  currentPath,
  onConfirm,
  onCancel,
  loading,
  error,
}: FolderPickerDialogProps) {
  const [browsePath, setBrowsePath] = useState('/');
  const [folders, setFolders] = useState<FileInfo[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadDirs = useCallback(async (path: string) => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Failed to load directory');
      const data = await res.json();
      // 只保留文件夹
      setFolders(data.items.filter((i: FileInfo) => i.type === 'directory'));
      setParentPath(data.parent);
      setBrowsePath(data.path);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadDirs('/');
  }, [loadDirs]);

  const handleNavigate = (path: string) => {
    loadDirs(path);
  };

  const handleGoUp = () => {
    if (parentPath) loadDirs(parentPath);
  };

  const handleConfirm = () => {
    onConfirm(browsePath);
  };

  const ModeIcon = mode === 'copy' ? Copy : Move;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <ModeIcon className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-[var(--accent)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--accent)]/30 shrink-0">
          <p className="text-sm">
            {mode === 'copy' ? '复制' : '移动'} <span className="font-mono font-medium">{sourceName}</span> 到：
          </p>
          <p className="text-sm font-mono text-[var(--primary)] mt-1">{browsePath}</p>
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-auto min-h-0">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
              <p className="text-sm">{fetchError}</p>
              <button onClick={() => loadDirs(browsePath)} className="text-sm underline">重试</button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {/* Go up button */}
              {parentPath !== null && (
                <button
                  onClick={handleGoUp}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[var(--accent)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-sm text-[var(--muted-foreground)]">返回上级</span>
                </button>
              )}

              {folders.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  当前目录下没有子文件夹
                </div>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => handleNavigate(folder.path)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[var(--accent)] transition-colors ${
                      browsePath === folder.path ? 'bg-[var(--accent)]' : ''
                    }`}
                  >
                    <Folder className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="truncate text-sm">{folder.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] shrink-0">
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="flex justify-between items-center">
            <button
              onClick={() => handleNavigate('/')}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              根目录
            </button>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
                disabled={loading}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? '处理中...' : `粘贴到此处`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
