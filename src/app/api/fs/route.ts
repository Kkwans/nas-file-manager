import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { FileInfo, FsListResponse } from '@/types';
import { getExtension, getMimeType, normalizePath, isSafePath } from '@/lib/file-utils';

// 根目录 - NAS 文件系统
const ROOT_DIR = process.env.NAS_ROOT_DIR || '/volume1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path') || '/';

    // 规范化路径
    const normalizedPath = normalizePath(requestedPath);

    // 安全检查
    if (!isSafePath(normalizedPath)) {
      return NextResponse.json(
        { error: 'Invalid path', code: 'INVALID_PATH', status: 400 },
        { status: 400 }
      );
    }

    // 构建实际文件系统路径
    const fullPath = path.join(ROOT_DIR, normalizedPath);

    // 确保路径在 ROOT_DIR 下
    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json(
        { error: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
        { status: 403 }
      );
    }

    // 检查路径是否存在
    try {
      const stat = await fs.stat(fullPath);
      if (!stat.isDirectory()) {
        return NextResponse.json(
          { error: 'Not a directory', code: 'NOT_DIRECTORY', status: 400 },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Directory not found', code: 'NOT_FOUND', status: 404 },
        { status: 404 }
      );
    }

    // 读取目录内容
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const items: FileInfo[] = [];

    for (const entry of entries) {
      try {
        const entryPath = path.join(fullPath, entry.name);
        const stat = await fs.stat(entryPath);
        const ext = entry.isDirectory() ? '' : getExtension(entry.name);

        items.push({
          name: entry.name,
          path: path.join(normalizedPath, entry.name),
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entry.isDirectory() ? 0 : stat.size,
          modified: stat.mtime.toISOString(),
          extension: ext,
          mimeType: entry.isDirectory() ? '' : getMimeType(ext),
          permissions: {
            readable: true, // TODO: 实际检查权限
            writable: true,
          },
        });
      } catch {
        // 跳过无法访问的文件
        continue;
      }
    }

    // 排序：目录在前，文件在后，各自按名称排序
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    // 计算父目录路径
    const parent = normalizedPath === '/' ? null : path.dirname(normalizedPath);

    const response: FsListResponse = {
      path: normalizedPath,
      parent,
      items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing directory:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

// 创建目录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: dirPath } = body;

    if (!dirPath) {
      return NextResponse.json(
        { error: 'Path is required', code: 'MISSING_PATH', status: 400 },
        { status: 400 }
      );
    }

    const normalizedPath = normalizePath(dirPath);
    if (!isSafePath(normalizedPath)) {
      return NextResponse.json(
        { error: 'Invalid path', code: 'INVALID_PATH', status: 400 },
        { status: 400 }
      );
    }

    const fullPath = path.join(ROOT_DIR, normalizedPath);
    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json(
        { error: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
        { status: 403 }
      );
    }

    await fs.mkdir(fullPath, { recursive: true });

    return NextResponse.json({ success: true, path: normalizedPath });
  } catch (error) {
    console.error('Error creating directory:', error);
    return NextResponse.json(
      { error: 'Failed to create directory', code: 'CREATE_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

// 删除文件/目录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path');

    if (!targetPath) {
      return NextResponse.json(
        { error: 'Path is required', code: 'MISSING_PATH', status: 400 },
        { status: 400 }
      );
    }

    const normalizedPath = normalizePath(targetPath);
    if (!isSafePath(normalizedPath)) {
      return NextResponse.json(
        { error: 'Invalid path', code: 'INVALID_PATH', status: 400 },
        { status: 400 }
      );
    }

    const fullPath = path.join(ROOT_DIR, normalizedPath);
    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json(
        { error: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
        { status: 403 }
      );
    }

    // 禁止删除根目录
    if (normalizedPath === '/') {
      return NextResponse.json(
        { error: 'Cannot delete root', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      );
    }

    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting:', error);
    return NextResponse.json(
      { error: 'Failed to delete', code: 'DELETE_ERROR', status: 500 },
      { status: 500 }
    );
  }
}
