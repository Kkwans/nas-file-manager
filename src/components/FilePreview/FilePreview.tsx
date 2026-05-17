'use client';

import { useState, useEffect } from 'react';
import { FileInfo, FileCategory } from '@/types';
import { getFileCategory, isTextFile, getExtension } from '@/lib/file-utils';
import { MarkdownPreview } from './MarkdownPreview';
import { CodePreview } from './CodePreview';
import { MediaPreview } from './MediaPreview';
import { Loader2, AlertCircle, Edit, Pencil, Download } from 'lucide-react';

interface FilePreviewProps {
  file: FileInfo;
  onEdit?: () => void;
  onRename?: () => void;
  onDownload?: () => void;
}

export function FilePreview({ file, onEdit, onRename, onDownload }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = getFileCategory(file.extension);
  const isText = isTextFile(file.extension);

  useEffect(() => {
    if (!isText) return;

    const loadContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(file.path)}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load file');
        }
        const data = await res.json();
        setContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file.path, isText]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2 px-4">
        <AlertCircle className="w-8 h-8" />
        <p className="text-center text-sm">{error}</p>
      </div>
    );
  }

  // 通用工具栏
  const Toolbar = ({ children }: { children?: React.ReactNode }) => (
    <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
      <span className="text-sm text-[var(--muted-foreground)] truncate min-w-0 flex-1 mr-2">{file.name}</span>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-sm rounded hover:bg-[var(--accent)] transition-colors touch-target"
            title="下载"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">下载</span>
          </button>
        )}
        {onRename && (
          <button
            onClick={onRename}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-sm rounded hover:bg-[var(--accent)] transition-colors touch-target"
            title="重命名"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重命名</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );

  // 媒体文件预览
  if (['image', 'video', 'audio', 'pdf'].includes(category)) {
    return (
      <div className="h-full flex flex-col">
        <Toolbar />
        <div className="flex-1 overflow-hidden">
          <MediaPreview
            filePath={file.path}
            category={category as FileCategory}
            mimeType={file.mimeType}
          />
        </div>
      </div>
    );
  }

  // Markdown 预览
  if (category === 'markdown' && content !== null) {
    return (
      <div className="h-full flex flex-col">
        <Toolbar>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity touch-target"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">编辑</span>
            </button>
          )}
        </Toolbar>
        <div className="flex-1 overflow-auto">
          <MarkdownPreview content={content} />
        </div>
      </div>
    );
  }

  // 代码文件预览
  if (isText && content !== null) {
    return (
      <div className="h-full flex flex-col">
        <Toolbar>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity touch-target"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">编辑</span>
            </button>
          )}
        </Toolbar>
        <div className="flex-1 overflow-hidden">
          <CodePreview content={content} extension={file.extension} />
        </div>
      </div>
    );
  }

  // 不支持的文件类型
  return (
    <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] gap-2 px-4">
      <p className="text-lg">不支持预览此文件类型</p>
      <p className="text-sm text-center">{file.name} ({file.extension || '无扩展名'})</p>
    </div>
  );
}
