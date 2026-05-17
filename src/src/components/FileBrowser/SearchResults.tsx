'use client';

import { SearchResult } from '@/types';
import { formatFileSize, formatDate, getFileCategory } from '@/lib/file-utils';
import {
  Search, FileText, FolderOpen, X, Loader2,
  FileCode, Image, Film, Music, File as FileIconLucide, Folder,
  FileIcon as FileIconRed,
} from 'lucide-react';
import React from 'react';

function getSearchFileIcon(item: SearchResult) {
  if (item.type === 'directory') {
    return <Folder className="w-5 h-5 text-blue-500" />;
  }
  const category = getFileCategory(item.extension);
  switch (category) {
    case 'markdown': return <FileText className="w-5 h-5 text-purple-500" />;
    case 'code': return <FileCode className="w-5 h-5 text-green-500" />;
    case 'image': return <Image className="w-5 h-5 text-pink-500" />;
    case 'video': return <Film className="w-5 h-5 text-orange-500" />;
    case 'audio': return <Music className="w-5 h-5 text-cyan-500" />;
    case 'pdf': return <FileIconRed className="w-5 h-5 text-red-500" />;
    default: return <FileIconLucide className="w-5 h-5 text-[var(--muted-foreground)]" />;
  }
}

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  total: number;
  loading: boolean;
  onSelect: (item: SearchResult) => void;
  onClose: () => void;
}

export function SearchResults({ query, results, total, loading, onSelect, onClose }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-[var(--muted-foreground)]">搜索中...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Search className="w-12 h-12 text-[var(--muted-foreground)] opacity-40" />
        <p className="text-sm text-[var(--muted-foreground)]">
          未找到「<span className="font-medium text-[var(--foreground)]">{query}</span>」相关文件
        </p>
      </div>
    );
  }

  // 高亮匹配文本
  const highlightMatch = (text: string, q: string) => {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800/60 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 结果头部 */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Search className="w-4 h-4" />
          <span>
            找到 <span className="font-medium text-[var(--foreground)]">{total}</span> 个结果
            {total >= 100 && <span className="text-xs ml-1">（最多显示 100 个）</span>}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors touch-target"
          title="关闭搜索"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 结果列表 */}
      <div className="flex-1 overflow-y-auto">
        {results.map((item, index) => (
          <button
            key={`${item.path}-${index}`}
            className="w-full flex items-start gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors border-b border-[var(--border)] last:border-b-0"
            onClick={() => onSelect(item)}
          >
            {/* 图标 */}
            <div className="shrink-0 mt-0.5">
              {getSearchFileIcon(item)}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              {/* 文件名 */}
              <div className="text-sm sm:text-base font-medium truncate">
                {highlightMatch(item.name, query)}
              </div>

              {/* 路径 */}
              <div className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                {item.path}
              </div>

              {/* 内容匹配片段 */}
              {item.matchType === 'content' && item.snippet && (
                <div className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2 bg-[var(--accent)] rounded px-2 py-1">
                  <FileText className="w-3 h-3 inline mr-1 opacity-60" />
                  {highlightMatch(item.snippet, query)}
                </div>
              )}

              {/* 元信息 */}
              <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                {item.type === 'file' && <span>{formatFileSize(item.size)}</span>}
                <span>{formatDate(item.modified)}</span>
                {item.matchType === 'content' && (
                  <span className="text-[var(--primary)]">内容匹配</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
