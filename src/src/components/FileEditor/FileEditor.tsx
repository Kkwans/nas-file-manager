'use client';

import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { FileInfo } from '@/types';
import { getMonacoLanguage, getFileCategory } from '@/lib/file-utils';
import { MarkdownPreview } from '@/components/FilePreview/MarkdownPreview';
import { Save, X, Loader2, Eye, Code, Pencil, Type } from 'lucide-react';

const SUPPORTED_ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gbk', label: 'GBK' },
  { value: 'gb2312', label: 'GB2312' },
  { value: 'big5', label: 'Big5' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'iso-8859-1', label: 'ISO-8859-1' },
  { value: 'shift_jis', label: 'Shift_JIS' },
  { value: 'euc-kr', label: 'EUC-KR' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
] as const;

interface FileEditorProps {
  file: FileInfo;
  initialContent: string;
  initialEncoding?: string;
  detectedEncoding?: string;
  onClose: () => void;
  onSave?: (content: string, encoding: string) => void;
  onRename?: () => void;
  onEncodingChange?: (encoding: string) => void;
}

export function FileEditor({
  file,
  initialContent,
  initialEncoding = 'utf-8',
  detectedEncoding,
  onClose,
  onSave,
  onRename,
  onEncodingChange,
}: FileEditorProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(getFileCategory(file.extension) === 'markdown');
  const [encoding, setEncoding] = useState(initialEncoding);
  const [encodingLoading, setEncodingLoading] = useState(false);

  const language = getMonacoLanguage(file.extension);
  const isMarkdown = getFileCategory(file.extension) === 'markdown';

  const handleChange = useCallback((value: string | undefined) => {
    setContent(value || '');
    setHasChanges(true);
  }, []);

  // 切换编码：重新从后端读取文件
  const handleEncodingChange = useCallback(async (newEncoding: string) => {
    if (newEncoding === encoding) return;

    setEncodingLoading(true);
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(file.path)}&encoding=${newEncoding}`);
      if (!res.ok) throw new Error('Failed to read file with encoding ' + newEncoding);

      const data = await res.json();
      setContent(data.content);
      setEncoding(data.encoding);
      setHasChanges(false);
      onEncodingChange?.(data.encoding);
    } catch (err) {
      alert('切换编码失败: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setEncodingLoading(false);
    }
  }, [encoding, file.path, onEncodingChange]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: file.path,
          content,
          encoding,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setHasChanges(false);
      onSave?.(content, encoding);
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [content, file.path, encoding, onSave]);

  // 快捷键保存
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  return (
    <div className="h-full flex flex-col" onKeyDown={handleKeyDown}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
        {/* 文件名行 */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{file.name}</span>
          {hasChanges && (
            <span className="text-xs text-orange-500 shrink-0">● 未保存</span>
          )}
          {onRename && (
            <button
              onClick={onRename}
              className="p-1 rounded hover:bg-[var(--accent)] transition-colors shrink-0 touch-target"
              title="重命名"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 操作按钮行 */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* 编码选择器 */}
          <div className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-[var(--muted-foreground)] hidden sm:block" />
            <select
              value={encoding}
              onChange={(e) => handleEncodingChange(e.target.value)}
              disabled={encodingLoading}
              className="text-xs px-1 sm:px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] disabled:opacity-50 cursor-pointer"
              title={detectedEncoding && detectedEncoding !== encoding ? `自动检测: ${detectedEncoding}` : undefined}
            >
              {SUPPORTED_ENCODINGS.map((enc) => (
                <option key={enc.value} value={enc.value}>
                  {enc.label}
                </option>
              ))}
              {!SUPPORTED_ENCODINGS.find((e) => e.value === encoding) && (
                <option value={encoding}>{encoding.toUpperCase()}</option>
              )}
            </select>
            {encodingLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {detectedEncoding && detectedEncoding !== encoding && (
              <span
                className="text-xs text-[var(--muted-foreground)] cursor-help hidden sm:inline"
                title={`自动检测为 ${detectedEncoding}`}
              >
                (检测: {detectedEncoding})
              </span>
            )}
          </div>

          {isMarkdown && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-sm rounded hover:bg-[var(--accent)] transition-colors touch-target"
              title={showPreview ? '隐藏预览' : '显示预览'}
            >
              {showPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{showPreview ? '代码' : '预览'}</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 touch-target"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">保存</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--accent)] transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 编辑器区域 - 移动端上下布局，桌面端左右布局 */}
      <div className={`flex-1 flex ${showPreview ? 'flex-col sm:flex-row' : 'flex-row'} overflow-hidden`}>
        <div className={`${showPreview ? 'h-1/2 sm:h-full sm:w-1/2' : 'w-full'} h-full`}>
          <Editor
            height="100%"
            language={language}
            value={content}
            onChange={handleChange}
            theme={theme === 'dark' ? 'vs-dark' : 'vs'}
            options={{
              fontSize: 14,
              tabSize: 2,
              wordWrap: 'on',
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 8, bottom: 8 },
              // Mobile optimizations
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
            }}
          />
        </div>

        {showPreview && (
          <div className="h-1/2 sm:h-full sm:w-1/2 border-t sm:border-t-0 sm:border-l border-[var(--border)] overflow-auto">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
