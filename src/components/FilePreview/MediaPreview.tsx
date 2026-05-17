'use client';

import { FileCategory } from '@/types';

interface MediaPreviewProps {
  filePath: string;
  category: FileCategory;
  mimeType: string;
}

// 构建文件 API URL
function getFileUrl(filePath: string): string {
  return `/api/file/raw?path=${encodeURIComponent(filePath)}`;
}

export function MediaPreview({ filePath, category, mimeType }: MediaPreviewProps) {
  const url = getFileUrl(filePath);

  switch (category) {
    case 'image':
      return (
        <div className="flex items-center justify-center h-full p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={filePath}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );

    case 'video':
      return (
        <div className="flex items-center justify-center h-full p-4">
          <video
            controls
            className="max-w-full max-h-full rounded-lg shadow-lg"
            preload="metadata"
          >
            <source src={url} type={mimeType} />
            您的浏览器不支持视频播放
          </video>
        </div>
      );

    case 'audio':
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
          <div className="w-24 h-24 rounded-full bg-[var(--muted)] flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
          <audio controls className="w-full max-w-md">
            <source src={url} type={mimeType} />
            您的浏览器不支持音频播放
          </audio>
        </div>
      );

    case 'pdf':
      return (
        <iframe
          src={url}
          className="w-full h-full border-0"
          title="PDF 预览"
        />
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
          不支持预览此文件类型
        </div>
      );
  }
}
