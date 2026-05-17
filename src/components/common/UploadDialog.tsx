'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadResult {
  name: string;
  path: string;
  size: number;
}

interface UploadError {
  name: string;
  error: string;
}

interface UploadDialogProps {
  targetDir: string;
  onConfirm: () => void;
  onCancel: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export function UploadDialog({ targetDir, onConfirm, onCancel }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [results, setResults] = useState<UploadResult[]>([]);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (status !== 'uploading') onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, onCancel]);

  // 添加文件
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const unique = Array.from(newFiles).filter((f) => !existing.has(f.name));
      return [...prev, ...unique];
    });
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [addFiles]
  );

  // 文件选择
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        addFiles(selected);
      }
      // 重置 input 以允许再次选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles]
  );

  // 移除文件
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 开始上传
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setStatus('uploading');
    setResults([]);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('dir', targetDir);
      for (const file of files) {
        formData.append('files', file);
      }

      const res = await fetch('/api/fs/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '上传失败');
      }

      setResults(data.uploaded || []);
      setErrors(data.errors || []);
      setStatus('done');
    } catch (err) {
      setErrors([{ name: '上传', error: err instanceof Error ? err.message : '上传失败' }]);
      setStatus('error');
    }
  }, [files, targetDir]);

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={status !== 'uploading' ? onCancel : undefined}
    >
      <div
        className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold">上传文件</h3>
          {status !== 'uploading' && (
            <button
              onClick={onCancel}
              className="p-1 rounded hover:bg-[var(--accent)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-4">
          {status === 'done' ? (
            // 上传结果
            <div className="space-y-3">
              {results.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    ✓ 成功上传 {results.length} 个文件
                  </h4>
                  <div className="space-y-1">
                    {results.map((r) => (
                      <div
                        key={r.path}
                        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="truncate">{r.name}</span>
                        <span className="text-xs shrink-0">({formatSize(r.size)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-500 mb-2">
                    ✗ {errors.length} 个文件上传失败
                  </h4>
                  <div className="space-y-1">
                    {errors.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">{e.name}</span>
                        <span className="text-xs">({e.error})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : status === 'error' ? (
            // 上传错误
            <div className="space-y-2">
              {errors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{e.name}: {e.error}</span>
                </div>
              ))}
            </div>
          ) : (
            // 文件选择区
            <div className="space-y-4">
              {/* 拖拽区域 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragOver
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]'
                  }
                `}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
                <p className="text-sm font-medium">
                  {isDragOver ? '松开鼠标上传' : '拖拽文件到这里，或点击选择'}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  支持任意类型文件，可同时上传多个
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* 已选文件列表 */}
              {files.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">已选择 {files.length} 个文件</span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                    >
                      清空
                    </button>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 px-3 py-2 rounded bg-[var(--accent)] group"
                      >
                        <File className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                        <span className="flex-1 text-sm truncate">{file.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                          {formatSize(file.size)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border)]">
          {status === 'done' ? (
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              完成
            </button>
          ) : status === 'error' ? (
            <>
              <button
                onClick={() => {
                  setStatus('idle');
                  setErrors([]);
                }}
                className="px-4 py-2 text-sm rounded border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
              >
                重试
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                关闭
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm rounded border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
                disabled={status === 'uploading'}
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || status === 'uploading'}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    上传 {files.length > 0 ? `(${files.length})` : ''}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
