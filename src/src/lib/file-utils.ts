import { FileCategory } from '@/types';

// 文件类型分类
const FILE_CATEGORIES: Record<FileCategory, string[]> = {
  markdown: ['md', 'markdown', 'mdown', 'mkd'],
  code: [
    'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'sql', 'json', 'yaml', 'yml',
    'xml', 'html', 'css', 'sh', 'bat', 'conf', 'log', 'txt', 'toml', 'ini',
    'env', 'gitignore', 'dockerignore', 'makefile', 'cmake',
    'c', 'cpp', 'h', 'hpp', 'go', 'rs', 'rb', 'php', 'swift', 'kt',
    'r', 'lua', 'perl', 'pl', 'scala', 'clj', 'hs', 'ex', 'exs',
  ],
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'avif'],
  video: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'wma', 'm4a', 'opus'],
  pdf: ['pdf'],
  unknown: [],
};

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  // 文本
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  json: 'application/json',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  xml: 'text/xml',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  ts: 'text/typescript',
  jsx: 'text/javascript',
  tsx: 'text/typescript',
  py: 'text/x-python',
  java: 'text/x-java',
  sql: 'text/x-sql',
  sh: 'text/x-shellscript',
  bat: 'text/x-bat',
  conf: 'text/plain',
  log: 'text/plain',
  toml: 'text/plain',
  ini: 'text/plain',
  c: 'text/x-c',
  cpp: 'text/x-c++',
  h: 'text/x-c',
  hpp: 'text/x-c++',
  go: 'text/x-go',
  rs: 'text/x-rust',
  rb: 'text/x-ruby',
  php: 'text/x-php',
  // 图片
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  avif: 'image/avif',
  // 视频
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  // 音频
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  aac: 'audio/aac',
  opus: 'audio/opus',
  m4a: 'audio/mp4',
  // 其他
  pdf: 'application/pdf',
};

/**
 * 获取文件扩展名
 */
export function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * 获取文件分类
 */
export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) return category as FileCategory;
  }
  return 'unknown';
}

/**
 * 获取 MIME 类型
 */
export function getMimeType(extension: string): string {
  const ext = extension.toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * 判断是否为文本文件
 */
export function isTextFile(extension: string): boolean {
  const category = getFileCategory(extension);
  return category === 'markdown' || category === 'code';
}

/**
 * 判断是否可预览
 */
export function isPreviewable(extension: string): boolean {
  const category = getFileCategory(extension);
  return category !== 'unknown';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 今天内显示时间
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 今年内显示月日
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }

  // 其他显示完整日期
  return date.toLocaleDateString('zh-CN');
}

/**
 * 根据扩展名获取 Monaco Editor 语言
 */
export function getMonacoLanguage(extension: string): string {
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    sql: 'sql',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    html: 'html',
    css: 'css',
    sh: 'shell',
    bat: 'bat',
    md: 'markdown',
    txt: 'plaintext',
    conf: 'plaintext',
    log: 'plaintext',
    toml: 'ini',
    ini: 'ini',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    r: 'r',
    lua: 'lua',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
  };
  return langMap[extension.toLowerCase()] || 'plaintext';
}

/**
 * 安全路径检查 - 防止路径遍历攻击
 */
export function isSafePath(path: string): boolean {
  // 禁止 .. 路径遍历
  if (path.includes('..')) return false;
  // 禁止空字节
  if (path.includes('\0')) return false;
  return true;
}

/**
 * 规范化路径
 */
export function normalizePath(path: string): string {
  // 确保以 / 开头
  if (!path.startsWith('/')) path = '/' + path;
  // 移除末尾的 /（除非是根路径）
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  // 规范化连续的 /
  path = path.replace(/\/+/g, '/');
  return path;
}
