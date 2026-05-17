import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { normalizePath, isSafePath } from '@/lib/file-utils';

const ROOT_DIR = process.env.NAS_ROOT_DIR || '/volume1';

// 复制文件/目录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, target } = body;

    if (!source || !target) {
      return NextResponse.json(
        { error: 'Source and target paths are required', code: 'MISSING_PARAMS', status: 400 },
        { status: 400 }
      );
    }

    const normalizedSource = normalizePath(source);
    const normalizedTarget = normalizePath(target);

    if (!isSafePath(normalizedSource) || !isSafePath(normalizedTarget)) {
      return NextResponse.json(
        { error: 'Invalid path', code: 'INVALID_PATH', status: 400 },
        { status: 400 }
      );
    }

    const fullSource = path.join(ROOT_DIR, normalizedSource);
    const fullTarget = path.join(ROOT_DIR, normalizedTarget);

    if (!fullSource.startsWith(ROOT_DIR) || !fullTarget.startsWith(ROOT_DIR)) {
      return NextResponse.json(
        { error: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
        { status: 403 }
      );
    }

    // 检查源文件是否存在
    try {
      await fs.stat(fullSource);
    } catch {
      return NextResponse.json(
        { error: 'Source not found', code: 'NOT_FOUND', status: 404 },
        { status: 404 }
      );
    }

    // 检查目标是否已存在
    try {
      await fs.stat(fullTarget);
      return NextResponse.json(
        { error: 'Target already exists', code: 'ALREADY_EXISTS', status: 409 },
        { status: 409 }
      );
    } catch {
      // 目标不存在，可以继续
    }

    // 确保目标父目录存在
    const targetDir = path.dirname(fullTarget);
    await fs.mkdir(targetDir, { recursive: true });

    // 递归复制
    await copyRecursive(fullSource, fullTarget);

    return NextResponse.json({ success: true, path: normalizedTarget });
  } catch (error) {
    console.error('Error copying:', error);
    return NextResponse.json(
      { error: 'Failed to copy', code: 'COPY_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

async function copyRecursive(src: string, dest: string) {
  const stat = await fs.stat(src);

  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry.name), path.join(dest, entry.name));
    }
  } else {
    await fs.copyFile(src, dest);
  }
}
