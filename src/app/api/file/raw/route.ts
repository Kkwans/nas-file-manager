import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { normalizePath, isSafePath, getMimeType, getExtension } from '@/lib/file-utils';

const ROOT_DIR = process.env.NAS_ROOT_DIR || '/volume1';

// 提供原始文件内容（用于图片/视频/音频预览）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path');

    if (!requestedPath) {
      return new NextResponse('Path is required', { status: 400 });
    }

    const normalizedPath = normalizePath(requestedPath);
    if (!isSafePath(normalizedPath)) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    const fullPath = path.join(ROOT_DIR, normalizedPath);
    if (!fullPath.startsWith(ROOT_DIR)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      return new NextResponse('Is a directory', { status: 400 });
    }

    const ext = getExtension(requestedPath);
    const mimeType = getMimeType(ext);
    const content = await fs.readFile(fullPath);
    const download = searchParams.get('download') === '1';
    const fileName = path.basename(fullPath);

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=3600',
        ...(download ? {
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        } : {}),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('File not found', { status: 404 });
    }
    console.error('Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
