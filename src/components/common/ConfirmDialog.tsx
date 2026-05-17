'use client';

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  danger = false,
  onConfirm,
  onCancel,
  loading,
  error,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle className="w-5 h-5 text-red-500" />}
            <h3 className="font-semibold">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-[var(--accent)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">{message}</p>

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 ${
                danger ? 'bg-red-500' : 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              }`}
            >
              {loading ? '处理中...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
