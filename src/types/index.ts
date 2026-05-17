// 文件信息
export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
  extension: string;
  mimeType: string;
  permissions: {
    readable: boolean;
    writable: boolean;
  };
}

// 目录列表响应
export interface FsListResponse {
  path: string;
  parent: string | null;
  items: FileInfo[];
}

// 文件内容响应
export interface FileContentResponse {
  path: string;
  name: string;
  extension: string;
  encoding: string;
  detectedEncoding: string;
  size: number;
  modified: string;
  content: string;
  mimeType: string;
}

// 编辑器配置
export interface EditorConfig {
  language: string;
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: boolean;
}

// 支持的文件类型分类
export type FileCategory = 'markdown' | 'code' | 'image' | 'video' | 'audio' | 'pdf' | 'unknown';

// 文件操作类型
export type FileOperation = 'rename' | 'delete' | 'copy' | 'move' | 'mkdir';

// 文件操作请求
export interface FileOperationRequest {
  operation: FileOperation;
  path: string;
  target?: string; // rename/copy/move 的目标路径
}

// API 错误响应
export interface ApiError {
  error: string;
  code: string;
  status: number;
}
