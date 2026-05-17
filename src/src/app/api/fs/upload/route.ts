import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { normalizePath, isSafePath } from '@/lib/file-utils';

const ROOT_DIR = process.env.NAS_ROOT_DIR || '/volume1';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const targetDir = formData.get('dir') as string;

    if (!targetDir) {
      return NextResponse.json({ error: '目标目录不能为空' }, { status: 400 });
    }

    const normalizedDir = normalizePath(targetDir);
    if (!isSafePath(normalizedDir)) {
      return NextResponse.json({ error: '无效的目录路径' }, { status: 400 });
    }

    const fullDir = path.join(ROOT_DIR, normalizedDir);
    if (!fullDir.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: '访问被拒绝' }, { status: 403 });
    }

    // 确保目标目录存在
    try {
      const stat = await fs.stat(fullDir);
      if (!stat.isDirectory()) {
        return NextResponse.json({ error: '目标不是目录' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: '目标目录不存在' }, { status: 404 });
    }

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    const results: { name: string; path: string; size: number }[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const file of files) {
      try {
        const fileName = file.name;
        // 安全检查文件名
        if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('\0')) {
          errors.push({ name: fileName || 'unknown', error: '无效的文件名' });
          continue;
        }

        const targetPath = path.join(fullDir, fileName);
        if (!targetPath.startsWith(ROOT_DIR)) {
          errors.push({ name: fileName, error: '路径越界' });
          continue;
        }

        // 读取文件内容
        const buffer = Buffer.from(await file.arrayBuffer());

        // 写入文件
        await fs.writeFile(targetPath, buffer);

        const relativePath = path.join(normalizedDir, fileName);
        results.push({
          name: fileName,
          path: relativePath,
          size: buffer.length,
        });
      } catch (err) {
        errors.push({
          name: file.name,
          error: err instanceof Error ? err.message : '上传失败',
        });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
