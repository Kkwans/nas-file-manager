'use client';

import { useEffect, useRef } from 'react';
import { FileInfo } from '@/types';
import { isTextFile } from '@/lib/file-utils';
import {
  Eye,
  Edit3,
  Copy,
  Move,
  Trash2,
  Download,
  FolderPlus,
  FilePlus,
  Pencil,
  Upload,
} from 'lucide-react';

interface FileContextMenuProps {
  item: FileInfo;
  position: { x: number; y: number };
  onClose: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onRename: () => void;
  onCopy: () => void;
  onMove: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onUpload: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
}

export function FileContextMenu({
  item,
  position,
  onClose,
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
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (rect.right > vw) {
        menuRef.current.style.left = `${vw - rect.width - 8}px`;
      }
      if (rect.bottom > vh) {
        menuRef.current.style.top = `${vh - rect.height - 8}px`;
      }
    }
  }, [position]);

  const isDir = item.type === 'directory';
  const isText = isTextFile(item.extension);

  type MenuItem = {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    divider?: boolean;
  };

  const items: MenuItem[] = [];

  if (!isDir) {
    items.push({ icon: <Eye className="w-4 h-4" />, label: '预览', onClick: onPreview });
    if (isText) {
      items.push({ icon: <Edit3 className="w-4 h-4" />, label: '编辑', onClick: onEdit });
    }
    items.push({ icon: <Download className="w-4 h-4" />, label: '下载', onClick: onDownload, divider: true });
  }

  items.push({ icon: <Pencil className="w-4 h-4" />, label: '重命名', onClick: onRename });
  items.push({ icon: <Copy className="w-4 h-4" />, label: '复制到...', onClick: onCopy });
  items.push({ icon: <Move className="w-4 h-4" />, label: '移动到...', onClick: onMove, divider: true });

  if (isDir) {
    items.push({ icon: <Upload className="w-4 h-4" />, label: '上传文件', onClick: onUpload });
    items.push({ icon: <FilePlus className="w-4 h-4" />, label: '新建文件', onClick: onNewFile });
    items.push({ icon: <FolderPlus className="w-4 h-4" />, label: '新建文件夹', onClick: onNewFolder, divider: true });
  }

  items.push({ icon: <Trash2 className="w-4 h-4" />, label: '删除', onClick: onDelete, danger: true });

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((mi, i) => (
        <div key={i}>
          {mi.divider && i > 0 && <div className="my-1 border-t border-[var(--border)]" />}
          <button
            onClick={() => {
              mi.onClick();
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              mi.danger
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                : 'hover:bg-[var(--accent)]'
            }`}
          >
            {mi.icon}
            {mi.label}
          </button>
        </div>
      ))}
    </div>
  );
}
