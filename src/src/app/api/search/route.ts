import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { FileInfo } from '@/types';
import { getExtension, getMimeType, normalizePath, isSafePath } from '@/lib/file-utils';

const ROOT_DIR = process.env.NAS_ROOT_DIR || '/volume1';
const MAX_RESULTS = 100;
const MAX_DEPTH = 10;
const CONTENT_SEARCH_MAX_SIZE = 1024 * 1024; // 1MB - 只搜索小文件的内容

interface SearchResult extends FileInfo {
  matchType: 'name' | 'content';
  snippet?: string; // 内容匹配时的片段
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const searchPath = searchParams.get('path') || '/';
    const matchType = searchParams.get('type') || 'all'; // all | name | content
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), MAX_RESULTS);

    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Query is required', code: 'MISSING_QUERY', status: 400 },
        { status: 400 }
      );
    }

    const normalizedPath = normalizePath(searchPath);
    if (!isSafePath(normalizedPath)) {
      return NextResponse.json(
        { error: 'Invalid path', code: 'INVALID_PATH', status: 400 },
        { status: 400 }
      );
    }

    const basePath = path.join(ROOT_DIR, normalizedPath);
    if (!basePath.startsWith(ROOT_DIR)) {
      return NextResponse.json(
        { error: 'Access denied', code: 'ACCESS_DENIED', status: 400 },
        { status: 400 }
      );
    }

    // 验证起始路径存在
    try {
      const stat = await fs.stat(basePath);
      if (!stat.isDirectory()) {
        return NextResponse.json(
          { error: 'Search path must be a directory', code: 'NOT_DIRECTORY', status: 400 },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Search path not found', code: 'NOT_FOUND', status: 404 },
        { status: 404 }
      );
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryStr = query; // capture for inner function

    // 递归搜索
    async function searchDir(dirPath: string, relativePath: string, depth: number) {
      if (depth > MAX_DEPTH || results.length >= limit) return;

      let entries;
      try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
      } catch {
        return; // 跳过无权限的目录
      }

      for (const entry of entries) {
        if (results.length >= limit) break;

        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath === '/' ? `/${entry.name}` : `${relativePath}/${entry.name}`;
        const isDir = entry.isDirectory();

        // 名称匹配
        const nameMatch = entry.name.toLowerCase().includes(queryLower);

        if (nameMatch && (matchType === 'all' || matchType === 'name')) {
          try {
            const stat = await fs.stat(fullPath);
            const ext = isDir ? '' : getExtension(entry.name);
            results.push({
              name: entry.name,
              path: relPath,
              type: isDir ? 'directory' : 'file',
              size: isDir ? 0 : stat.size,
              modified: stat.mtime.toISOString(),
              extension: ext,
              mimeType: isDir ? '' : getMimeType(ext),
              permissions: { readable: true, writable: true },
              matchType: 'name',
            });
          } catch {
            // 跳过无法访问的文件
          }
        }

        // 内容搜索（仅文本文件，大小限制内）
        if (!isDir && (matchType === 'all' || matchType === 'content') && !nameMatch) {
          try {
            const stat = await fs.stat(fullPath);
            const ext = getExtension(entry.name);
            const isText = isTextSearchable(ext);

            if (isText && stat.size <= CONTENT_SEARCH_MAX_SIZE && stat.size > 0) {
              const content = await fs.readFile(fullPath, 'utf-8');
              const contentLower = content.toLowerCase();
              const idx = contentLower.indexOf(queryLower);

              if (idx !== -1) {
                // 提取匹配片段（前后各 50 字符）
                const start = Math.max(0, idx - 50);
                const end = Math.min(content.length, idx + queryStr.length + 50);
                let snippet = content.slice(start, end).replace(/\n/g, ' ');
                if (start > 0) snippet = '...' + snippet;
                if (end < content.length) snippet = snippet + '...';

                results.push({
                  name: entry.name,
                  path: relPath,
                  type: 'file',
                  size: stat.size,
                  modified: stat.mtime.toISOString(),
                  extension: ext,
                  mimeType: getMimeType(ext),
                  permissions: { readable: true, writable: true },
                  matchType: 'content',
                  snippet,
                });
              }
            }
          } catch {
            // 跳过无法读取的文件
          }
        }

        // 递归搜索子目录
        if (isDir) {
          await searchDir(fullPath, relPath, depth + 1);
        }
      }
    }

    await searchDir(basePath, normalizedPath, 0);

    return NextResponse.json({
      query,
      path: normalizedPath,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', code: 'SEARCH_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

// 判断文件扩展名是否可以搜索内容
function isTextSearchable(ext: string): boolean {
  const searchable = new Set([
    'txt', 'md', 'markdown', 'mdown', 'mkd',
    'js', 'ts', 'jsx', 'tsx', 'json', 'yaml', 'yml',
    'xml', 'html', 'htm', 'css', 'scss', 'less',
    'py', 'java', 'sql', 'sh', 'bat', 'cmd',
    'conf', 'cfg', 'ini', 'toml', 'env',
    'log', 'out', 'err',
    'c', 'cpp', 'h', 'hpp', 'go', 'rs', 'rb', 'php',
    'swift', 'kt', 'scala', 'r', 'lua', 'pl',
    'dockerfile', 'makefile', 'gitignore', 'dockerignore',
    'csv', 'tsv',
  ]);
  return searchable.has(ext.toLowerCase());
}
