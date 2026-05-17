import iconv from 'iconv-lite';
import chardet from 'chardet';

// 支持的编码列表
export const SUPPORTED_ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gbk', label: 'GBK (中文)' },
  { value: 'gb2312', label: 'GB2312 (简体中文)' },
  { value: 'big5', label: 'Big5 (繁体中文)' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'iso-8859-1', label: 'ISO-8859-1 (Latin-1)' },
  { value: 'shift_jis', label: 'Shift_JIS (日文)' },
  { value: 'euc-kr', label: 'EUC-KR (韩文)' },
  { value: 'utf-16', label: 'UTF-16' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
] as const;

export type SupportedEncoding = (typeof SUPPORTED_ENCODINGS)[number]['value'];

/**
 * 检测文件编码
 * @param buffer 文件内容的 Buffer
 * @returns 检测到的编码名称（规范化为小写）
 */
export function detectEncoding(buffer: Buffer): string {
  // 优先检查 BOM
  if (buffer.length >= 3) {
    // UTF-8 BOM: EF BB BF
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return 'utf-8';
    }
  }
  if (buffer.length >= 2) {
    // UTF-16 LE BOM: FF FE
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      return 'utf-16le';
    }
    // UTF-16 BE BOM: FE FF
    if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      return 'utf-16be';
    }
  }

  // 使用 chardet 检测
  const detected = chardet.detect(buffer);
  if (detected) {
    // 规范化编码名称
    const normalized = normalizeEncoding(detected);
    if (normalized) return normalized;
  }

  // 兜底：尝试 UTF-8
  const decoded = iconv.decode(buffer, 'utf-8');
  // 检查是否有替换字符（U+FFFD），说明不是有效的 UTF-8
  if (decoded.includes('\ufffd')) {
    return 'gbk'; // 中文环境下最可能的编码
  }

  return 'utf-8';
}

/**
 * 规范化编码名称
 */
function normalizeEncoding(encoding: string): string | null {
  const lower = encoding.toLowerCase().replace(/[-_\s]/g, '');

  const mapping: Record<string, string> = {
    utf8: 'utf-8',
    utf16: 'utf-16',
    utf16le: 'utf-16le',
    utf16be: 'utf-16be',
    ascii: 'ascii',
    usascii: 'ascii',
    iso88591: 'iso-8859-1',
    latin1: 'iso-8859-1',
    gbk: 'gbk',
    gb2312: 'gb2312',
    gbk2312: 'gbk',
    big5: 'big5',
    big5hkscs: 'big5',
    shiftjis: 'shift_jis',
    sjis: 'shift_jis',
    euckr: 'euc-kr',
    windows949: 'euc-kr',
  };

  return mapping[lower] || null;
}

/**
 * 用指定编码解码 Buffer 为字符串
 */
export function decodeBuffer(buffer: Buffer, encoding: string): string {
  // Node.js 原生支持的编码直接使用
  const nativeEncodings: Record<string, BufferEncoding> = {
    'utf-8': 'utf-8',
    'utf8': 'utf-8',
    ascii: 'ascii',
    'iso-8859-1': 'latin1',
    latin1: 'latin1',
    'utf-16le': 'utf16le',
    utf16le: 'utf16le',
    base64: 'base64',
    hex: 'hex',
  };

  if (nativeEncodings[encoding]) {
    return buffer.toString(nativeEncodings[encoding]);
  }

  // 其他编码使用 iconv-lite（支持 gbk, big5, shift_jis 等）
  return iconv.decode(buffer, encoding);
}

/**
 * 用指定编码编码字符串为 Buffer
 */
export function encodeString(content: string, encoding: string): Buffer {
  const nativeEncodings: Record<string, BufferEncoding> = {
    'utf-8': 'utf-8',
    'utf8': 'utf-8',
    ascii: 'ascii',
    'iso-8859-1': 'latin1',
    latin1: 'latin1',
    'utf-16le': 'utf16le',
    utf16le: 'utf16le',
  };

  if (nativeEncodings[encoding]) {
    return Buffer.from(content, nativeEncodings[encoding]);
  }

  // 其他编码使用 iconv-lite
  return iconv.encode(content, encoding);
}
