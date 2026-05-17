'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FileInfo } from '@/types';
import { formatFileSize, formatDate, getFileCategory, isTextFile } from '@/lib/file-utils';
import {
  Folder,
  FileText,
  FileCode,
  Image,
  Film,
  Music,
  FileIcon,
  File,
  MoreVertical,
  Eye,
  Edit3,
  Copy,
  Move,
  Trash2,
  Download,
  Pencil,
  Upload,
  FilePlus,
  FolderPlus,
} from 'lucide-react';
import { FileContextMenu } from './FileContextMenu';
import { ActionSheet, ActionSheetItem } from '@/components/common/ActionSheet';
import { RefreshCw } from 'lucide-react';

interface FileListProps {
  items: FileInfo[];
  onItemClick: (item: FileInfo) => void;
  selectedPath?: string;
  onPreview?: (item: FileInfo) => void;
  onEdit?: (item: FileInfo) => void;
  onRename?: (item: FileInfo) => void;
  onCopy?: (item: FileInfo) => void;
  onMove?: (item: FileInfo) => void;
  onDelete?: (item: FileInfo) => void;
  onDownload?: (item: FileInfo) => void;
  onUpload?: (inDir?: string) => void;
  onNewFile?: (inDir?: string) => void;
  onNewFolder?: (inDir?: string) => void;
  /** Pull-to-refresh callback */
  onPullRefresh?: () => void;
  /** Whether pull-to-refresh is in progress */
  pullRefreshing?: boolean;
}

function getFileIcon(item: FileInfo) {
  if (item.type === 'directory') {
    return <Folder className="w-5 h-5 text-blue-500" />;
  }

  const category = getFileCategory(item.extension);

  switch (category) {
    case 'markdown':
      return <FileText className="w-5 h-5 text-purple-500" />;
    case 'code':
      return <FileCode className="w-5 h-5 text-green-500" />;
    case 'image':
      return <Image className="w-5 h-5 text-pink-500" />;
    case 'video':
      return <Film className="w-5 h-5 text-orange-500" />;
    case 'audio':
      return <Music className="w-5 h-5 text-cyan-500" />;
    case 'pdf':
      return <FileIcon className="w-5 h-5 text-red-500" />;
    default:
      return <File className="w-5 h-5 text-[var(--muted-foreground)]" />;
  }
}

// Detect if we're on a touch device
function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function FileList({
  items,
  onItemClick,
  selectedPath,
  onPreview,
  onEdit,
  onRename,
  onCopy,
  onMove,
  onDelete,
  onDownload,
  onUpload,
  onNewFile,
  onNewFolder,
  onPullRefresh,
  pullRefreshing,
}: FileListProps) {
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const pullStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePullTouchStart = useCallback((e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop <= 0 && onPullRefresh) {
      pullStartY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, [onPullRefresh]);

  const handlePullTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || pullRefreshing) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.5, 80)); // Dampen pull, max 80px
    }
  }, [pulling, pullRefreshing]);

  const handlePullTouchEnd = useCallback(() => {
    if (pullDistance > 50 && onPullRefresh) {
      onPullRefresh();
    }
    setPullDistance(0);
    setPulling(false);
  }, [pullDistance, onPullRefresh]);
  const [contextMenu, setContextMenu] = useState<{
    item: FileInfo;
    x: number;
    y: number;
  } | null>(null);

  const [actionSheet, setActionSheet] = useState<FileInfo | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoved = useRef(false);

  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileInfo) => {
    e.preventDefault();
    if (isTouchDevice()) {
      // On touch devices, show action sheet instead
      setActionSheet(item);
    } else {
      setContextMenu({ item, x: e.clientX, y: e.clientY });
    }
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const closeActionSheet = useCallback(() => {
    setActionSheet(null);
  }, []);

  // Long press support for mobile
  const handleTouchStart = useCallback((item: FileInfo) => {
    touchMoved.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        setActionSheet(item);
      }
    }, 500);
  }, []);

  const handleTouchMove = useCallback(() => {
    touchMoved.current = true;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const getActionSheetItems = useCallback((item: FileInfo): ActionSheetItem[] => {
    const isDir = item.type === 'directory';
    const isText = isTextFile(item.extension);
    const items: ActionSheetItem[] = [];

    if (!isDir) {
      items.push({ icon: <Eye className="w-5 h-5" />, label: '预览', onClick: () => onPreview?.(item) });
      if (isText) {
        items.push({ icon: <Edit3 className="w-5 h-5" />, label: '编辑', onClick: () => onEdit?.(item) });
      }
      items.push({ icon: <Download className="w-5 h-5" />, label: '下载', onClick: () => onDownload?.(item) });
    }

    items.push({ icon: <Pencil className="w-5 h-5" />, label: '重命名', onClick: () => onRename?.(item) });
    items.push({ icon: <Copy className="w-5 h-5" />, label: '复制到...', onClick: () => onCopy?.(item) });
    items.push({ icon: <Move className="w-5 h-5" />, label: '移动到...', onClick: () => onMove?.(item) });

    if (isDir) {
      items.push({ icon: <Upload className="w-5 h-5" />, label: '上传文件', onClick: () => onUpload?.(item.path) });
      items.push({ icon: <FilePlus className="w-5 h-5" />, label: '新建文件', onClick: () => onNewFile?.(item.path) });
      items.push({ icon: <FolderPlus className="w-5 h-5" />, label: '新建文件夹', onClick: () => onNewFolder?.(item.path) });
    }

    items.push({ icon: <Trash2 className="w-5 h-5" />, label: '删除', onClick: () => onDelete?.(item), danger: true });

    return items;
  }, [onPreview, onEdit, onRename, onCopy, onMove, onDelete, onDownload, onUpload, onNewFile, onNewFolder]);

  // Pull-to-refresh indicator
  const PullIndicator = () => {
    if (!onPullRefresh) return null;
    const show = pullDistance > 10 || pullRefreshing;
    if (!show) return null;
    return (
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pullRefreshing ? 40 : pullDistance * 0.5 }}
      >
        <RefreshCw
          className={`w-5 h-5 text-[var(--muted-foreground)] ${
            pullRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: pullRefreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
            opacity: Math.min(pullDistance / 50, 1),
          }}
        />
        {pullRefreshing && (
          <span className="ml-2 text-xs text-[var(--muted-foreground)]">刷新中...</span>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)]">
        <Folder className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg">此文件夹为空</p>
        {onNewFile && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onNewFile()}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
            >
              新建文件
            </button>
            {onNewFolder && (
              <button
                onClick={() => onNewFolder()}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
              >
                新建文件夹
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="divide-y divide-[var(--border)] touch-show-actions h-full overflow-auto"
      onTouchStart={(e) => {
        handlePullTouchStart(e);
      }}
      onTouchMove={(e) => {
        handlePullTouchMove(e);
      }}
      onTouchEnd={handlePullTouchEnd}
    >
      <PullIndicator />
      {items.map((item) => (
        <div
          key={item.path}
          className={`group relative flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors ${
            selectedPath === item.path ? 'bg-[var(--accent)]' : ''
          }`}
          onClick={() => onItemClick(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          onMouseEnter={() => setHoveredPath(item.path)}
          onMouseLeave={() => setHoveredPath(null)}
          onTouchStart={() => handleTouchStart(item)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Icon */}
          <div className="shrink-0">{getFileIcon(item)}</div>

          {/* Name & info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate text-sm sm:text-base">{item.name}</div>
            {item.type === 'file' && (
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {item.extension.toUpperCase()} · {formatFileSize(item.size)}
              </div>
            )}
          </div>

          {/* Date - hidden on mobile */}
          <div className="shrink-0 text-xs text-[var(--muted-foreground)] hidden sm:block">
            {formatDate(item.modified)}
          </div>

          {/* Action button - always visible on touch, hover on desktop */}
          <button
            className="file-action-btn shrink-0 p-1.5 rounded-lg hover:bg-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity touch-target"
            onClick={(e) => {
              e.stopPropagation();
              if (isTouchDevice()) {
                setActionSheet(item);
              } else {
                handleContextMenu(e, item);
              }
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Context Menu (desktop) */}
      {contextMenu && (
        <FileContextMenu
          item={contextMenu.item}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
          onPreview={() => onPreview?.(contextMenu.item)}
          onEdit={() => onEdit?.(contextMenu.item)}
          onRename={() => onRename?.(contextMenu.item)}
          onCopy={() => onCopy?.(contextMenu.item)}
          onMove={() => onMove?.(contextMenu.item)}
          onDelete={() => onDelete?.(contextMenu.item)}
          onDownload={() => onDownload?.(contextMenu.item)}
          onUpload={() => onUpload?.(contextMenu.item.type === 'directory' ? contextMenu.item.path : undefined)}
          onNewFile={() => onNewFile?.(contextMenu.item.type === 'directory' ? contextMenu.item.path : undefined)}
          onNewFolder={() => onNewFolder?.(contextMenu.item.type === 'directory' ? contextMenu.item.path : undefined)}
        />
      )}

      {/* Action Sheet (mobile) */}
      {actionSheet && (
        <ActionSheet
          title={actionSheet.name}
          items={getActionSheetItems(actionSheet)}
          onCancel={closeActionSheet}
        />
      )}
    </div>
  );
}
