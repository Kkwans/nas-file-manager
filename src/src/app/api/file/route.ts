import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { FileContentResponse } from '@/types';
import { getExtension, getMimeType, normalizePath, isSafePath, isTextFile } from '@/lib/file-utils';
import { detectEncoding, decodeBuffer, encodeString, SUPPORTED_ENCODINGS } from '@/lib/encoding';

const ROOT_DIR = process.env.NAS_ROOT_DIR || '/volume1';

// 读取文件内容
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path');
    const requestedEncoding = searchParams.get('encoding'); // 可选，不传则自动检测

    if (!requestedPath) {
      return NextResponse.json(
        { error: 'Path is required', code: 'MISSING_PATH', status: 400 },
        { status: 400 }
      );
    }

    const normalizedPath = normalizePath(requestedPath);
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

    // 检查文件是否存在
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      return NextResponse.json(
        { error: 'Cannot read directory as file', code: 'IS_DIRECTORY', status: 400 },
        { status: 400 }
      );
    }

    const ext = getExtension(requestedPath);
    const fileName = path.basename(requestedPath);

    // 检查是否为文本文件
    if (!isTextFile(ext)) {
      return NextResponse.json(
        { error: 'Binary file, cannot read as text', code: 'BINARY_FILE', status: 400 },
        { status: 400 }
      );
    }

    // 大文件检查（限制 10MB）
    const MAX_SIZE = 10 * 1024 * 1024;
    if (stat.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large', code: 'FILE_TOO_LARGE', status: 400 },
        { status: 400 }
      );
    }

    // 读取原始 Buffer
    const buffer = await fs.readFile(fullPath);

    // 检测编码（如果未指定）
    const detectedEncoding = detectEncoding(buffer);
    const encoding = requestedEncoding || detectedEncoding;

    // 用指定编码解码
    const content = decodeBuffer(buffer, encoding);

    const response: FileContentResponse = {
      path: normalizedPath,
      name: fileName,
      extension: ext,
      encoding,
      detectedEncoding,
      size: stat.size,
      modified: stat.mtime.toISOString(),
      content,
      mimeType: getMimeType(ext),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found', code: 'NOT_FOUND', status: 404 },
        { status: 404 }
      );
    }
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

// 保存文件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: filePath, content, encoding = 'utf-8' } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'Path and content are required', code: 'MISSING_PARAMS', status: 400 },
        { status: 400 }
      );
    }

    const normalizedPath = normalizePath(filePath);
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

    // 确保目录存在
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    // 使用 iconv-lite 编码写入（支持 GBK 等非 UTF-8 编码）
    const buffer = encodeString(content, encoding);
    await fs.writeFile(fullPath, buffer);

    // 获取更新后的文件信息
    const stat = await fs.stat(fullPath);

    return NextResponse.json({
      success: true,
      path: normalizedPath,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file', code: 'SAVE_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

// 重命名文件/目录
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: oldPath, newPath } = body;

    if (!oldPath || !newPath) {
      return NextResponse.json(
        { error: 'Both path and newPath are required', code: 'MISSING_PARAMS', status: 400 },
        { status: 400 }
      );
    }

    const normalizedOld = normalizePath(oldPath);
    const normalizedNew = normalizePath(newPath);

    if (!isSafePath(normalizedOld) || !isSafePath(normalizedNew)) {
      return NextResponse.json(
        { error: 'Invalid path', code: 'INVALID_PATH', status: 400 },
        { status: 400 }
      );
    }

    const fullOld = path.join(ROOT_DIR, normalizedOld);
    const fullNew = path.join(ROOT_DIR, normalizedNew);

    if (!fullOld.startsWith(ROOT_DIR) || !fullNew.startsWith(ROOT_DIR)) {
      return NextResponse.json(
        { error: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
        { status: 403 }
      );
    }

    await fs.rename(fullOld, fullNew);

    return NextResponse.json({ success: true, path: normalizedNew });
  } catch (error) {
    console.error('Error renaming:', error);
    return NextResponse.json(
      { error: 'Failed to rename', code: 'RENAME_ERROR', status: 500 },
      { status: 500 }
    );
  }
}
