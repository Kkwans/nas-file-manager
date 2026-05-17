'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileInfo, FsListResponse, SearchResult, SearchResponse } from '@/types';
import { isTextFile } from '@/lib/file-utils';
import { Header } from '@/components/common/Header';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { FileList } from '@/components/FileBrowser/FileList';
import { SearchResults } from '@/components/FileBrowser/SearchResults';
import { FilePreview } from '@/components/FilePreview/FilePreview';
import { FileEditor } from '@/components/FileEditor/FileEditor';
import { Loader2, AlertCircle, ArrowLeft, Plus, FolderPlus, FilePlus, Upload, ChevronLeft } from 'lucide-react';
import { RenameDialog } from '@/components/common/RenameDialog';
import { NewFileDialog } from '@/components/common/NewFileDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FolderPickerDialog } from '@/components/common/FolderPickerDialog';
import { UploadDialog } from '@/components/common/UploadDialog';

type ViewMode = 'browse' | 'preview' | 'edit';

export default function HomePage() {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<FileInfo[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 当前选中的文件/目录
  const [selectedItem, setSelectedItem] = useState<FileInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');

  // 编辑器内容
  const [editContent, setEditContent] = useState<string | null>(null);
  const [editEncoding, setEditEncoding] = useState<string>('utf-8');
  const [editDetectedEncoding, setEditDetectedEncoding] = useState<string | undefined>(undefined);
  const [editLoading, setEditLoading] = useState(false);

  // 重命名状态
  const [renameTarget, setRenameTarget] = useState<FileInfo | null>(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // 新建文件/文件夹状态
  const [newFileDialog, setNewFileDialog] = useState<{ type: 'file' | 'folder'; dir: string } | null>(null);
  const [newFileLoading, setNewFileLoading] = useState(false);
  const [newFileError, setNewFileError] = useState<string | null>(null);

  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<FileInfo | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 复制/移动状态
  const [copyTarget, setCopyTarget] = useState<FileInfo | null>(null);
  const [moveTarget, setMoveTarget] = useState<FileInfo | null>(null);
  const [copyMoveLoading, setCopyMoveLoading] = useState(false);
  const [copyMoveError, setCopyMoveError] = useState<string | null>(null);

  // 上传状态
  const [uploadTargetDir, setUploadTargetDir] = useState<string | null>(null);

  // 搜索状态
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  // 加载目录内容
  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load directory');
      }

      const data: FsListResponse = await res.json();
      setItems(data.items);
      setParentPath(data.parent);
      setCurrentPath(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadDirectory('/');
  }, [loadDirectory]);

  // 点击文件/目录
  const handleItemClick = useCallback(
    (item: FileInfo) => {
      if (item.type === 'directory') {
        setSelectedItem(null);
        setViewMode('browse');
        loadDirectory(item.path);
      } else {
        setSelectedItem(item);
        setViewMode('preview');
      }
    },
    [loadDirectory]
  );

  // 导航到指定路径
  const handleNavigate = useCallback(
    (path: string) => {
      setSelectedItem(null);
      setViewMode('browse');
      loadDirectory(path);
    },
    [loadDirectory]
  );

  // 返回上级目录
  const handleGoBack = useCallback(() => {
    if (parentPath) {
      handleNavigate(parentPath);
    }
  }, [parentPath, handleNavigate]);

  // 打开编辑器
  const handleEdit = useCallback(async (item?: FileInfo) => {
    const file = item || selectedItem;
    if (!file || !isTextFile(file.extension)) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(file.path)}`);
      if (!res.ok) throw new Error('Failed to load file');

      const data = await res.json();
      setEditContent(data.content);
      setEditEncoding(data.encoding || 'utf-8');
      setEditDetectedEncoding(data.detectedEncoding);
      setSelectedItem(file);
      setViewMode('edit');
    } catch (err) {
      alert('加载文件失败: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setEditLoading(false);
    }
  }, [selectedItem]);

  // 关闭编辑器
  const handleCloseEditor = useCallback(() => {
    setEditContent(null);
    setEditEncoding('utf-8');
    setEditDetectedEncoding(undefined);
    setViewMode('preview');
  }, []);

  // 保存成功后刷新
  const handleSave = useCallback(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  // ========== 重命名 ==========
  const handleRenameRequest = useCallback((item?: FileInfo) => {
    const target = item || selectedItem;
    if (!target) return;
    setRenameTarget(target);
    setRenameError(null);
  }, [selectedItem]);

  const handleRenameConfirm = useCallback(
    async (newName: string) => {
      if (!renameTarget) return;

      setRenameLoading(true);
      setRenameError(null);

      try {
        const dir = renameTarget.path.substring(0, renameTarget.path.lastIndexOf('/'));
        const newPath = dir + '/' + newName;

        const res = await fetch('/api/file', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: renameTarget.path, newPath }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to rename');
        }

        const data = await res.json();

        // Update selected item
        const updatedItem: FileInfo = {
          ...renameTarget,
          name: newName,
          path: data.path,
          extension: newName.includes('.') ? newName.split('.').pop()! : '',
        };
        setSelectedItem(updatedItem);
        setRenameTarget(null);
        loadDirectory(currentPath);
      } catch (err) {
        setRenameError(err instanceof Error ? err.message : '重命名失败');
      } finally {
        setRenameLoading(false);
      }
    },
    [renameTarget, currentPath, loadDirectory]
  );

  // ========== 新建文件/文件夹 ==========
  const handleNewFileRequest = useCallback((inDir?: string) => {
    setNewFileDialog({ type: 'file', dir: inDir || currentPath });
    setNewFileError(null);
  }, [currentPath]);

  const handleNewFolderRequest = useCallback((inDir?: string) => {
    setNewFileDialog({ type: 'folder', dir: inDir || currentPath });
    setNewFileError(null);
  }, [currentPath]);

  const handleNewFileConfirm = useCallback(
    async (name: string) => {
      if (!newFileDialog) return;

      setNewFileLoading(true);
      setNewFileError(null);

      try {
        if (newFileDialog.type === 'folder') {
          // 创建文件夹
          const fullPath = newFileDialog.dir === '/' ? `/${name}` : `${newFileDialog.dir}/${name}`;
          const res = await fetch('/api/fs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fullPath }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to create folder');
          }
        } else {
          // 创建文件（写入空内容）
          const fullPath = newFileDialog.dir === '/' ? `/${name}` : `${newFileDialog.dir}/${name}`;
          const res = await fetch('/api/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fullPath, content: '' }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to create file');
          }
        }

        setNewFileDialog(null);
        loadDirectory(currentPath);
      } catch (err) {
        setNewFileError(err instanceof Error ? err.message : '创建失败');
      } finally {
        setNewFileLoading(false);
      }
    },
    [newFileDialog, currentPath, loadDirectory]
  );

  // ========== 删除 ==========
  const handleDeleteRequest = useCallback((item?: FileInfo) => {
    const target = item || selectedItem;
    if (!target) return;
    setDeleteTarget(target);
    setDeleteError(null);
  }, [selectedItem]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/fs?path=${encodeURIComponent(deleteTarget.path)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      // If deleted the selected item, deselect
      if (selectedItem?.path === deleteTarget.path) {
        setSelectedItem(null);
        setViewMode('browse');
      }

      setDeleteTarget(null);
      loadDirectory(currentPath);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, selectedItem, currentPath, loadDirectory]);

  // ========== 复制 ==========
  const handleCopyRequest = useCallback((item?: FileInfo) => {
    const target = item || selectedItem;
    if (!target) return;
    setCopyTarget(target);
    setCopyMoveError(null);
  }, [selectedItem]);

  const handleCopyConfirm = useCallback(
    async (targetDir: string) => {
      if (!copyTarget) return;

      setCopyMoveLoading(true);
      setCopyMoveError(null);

      try {
        const targetPath = targetDir === '/' ? `/${copyTarget.name}` : `${targetDir}/${copyTarget.name}`;

        const res = await fetch('/api/fs/copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: copyTarget.path, target: targetPath }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to copy');
        }

        setCopyTarget(null);
        loadDirectory(currentPath);
      } catch (err) {
        setCopyMoveError(err instanceof Error ? err.message : '复制失败');
      } finally {
        setCopyMoveLoading(false);
      }
    },
    [copyTarget, currentPath, loadDirectory]
  );

  // ========== 移动 ==========
  const handleMoveRequest = useCallback((item?: FileInfo) => {
    const target = item || selectedItem;
    if (!target) return;
    setMoveTarget(target);
    setCopyMoveError(null);
  }, [selectedItem]);

  const handleMoveConfirm = useCallback(
    async (targetDir: string) => {
      if (!moveTarget) return;

      setCopyMoveLoading(true);
      setCopyMoveError(null);

      try {
        const targetPath = targetDir === '/' ? `/${moveTarget.name}` : `${targetDir}/${moveTarget.name}`;

        const res = await fetch('/api/file', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: moveTarget.path, newPath: targetPath }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to move');
        }

        // If moved the selected item, deselect
        if (selectedItem?.path === moveTarget.path) {
          setSelectedItem(null);
          setViewMode('browse');
        }

        setMoveTarget(null);
        loadDirectory(currentPath);
      } catch (err) {
        setCopyMoveError(err instanceof Error ? err.message : '移动失败');
      } finally {
        setCopyMoveLoading(false);
      }
    },
    [moveTarget, selectedItem, currentPath, loadDirectory]
  );

  // ========== 下载 ==========
  const handleDownload = useCallback((item?: FileInfo) => {
    const target = item || selectedItem;
    if (!target || target.type === 'directory') return;
    window.open(`/api/file/raw?path=${encodeURIComponent(target.path)}&download=1`, '_blank');
  }, [selectedItem]);

  // ========== 搜索 ==========
  const handleSearch = useCallback(async (query: string) => {
    setSearchActive(true);
    setSearchQuery(query);
    setSearchLoading(true);
    setSearchResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(currentPath)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Search failed');
      }
      const data: SearchResponse = await res.json();
      setSearchResults(data.results);
      setSearchTotal(data.total);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setSearchTotal(0);
    } finally {
      setSearchLoading(false);
    }
  }, [currentPath]);

  const handleSearchClose = useCallback(() => {
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchTotal(0);
  }, []);

  const handleSearchSelect = useCallback((item: SearchResult) => {
    if (item.type === 'directory') {
      setSearchActive(false);
      loadDirectory(item.path);
    } else {
      // 导航到文件所在目录并选中
      const dir = item.path.substring(0, item.path.lastIndexOf('/')) || '/';
      setSearchActive(false);
      setSelectedItem(item);
      setViewMode('preview');
      loadDirectory(dir);
    }
  }, [loadDirectory]);

  // ========== 上传 ==========
  const handleUploadRequest = useCallback((dir?: string) => {
    setUploadTargetDir(dir || currentPath);
  }, [currentPath]);

  const handleUploadConfirm = useCallback(() => {
    setUploadTargetDir(null);
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  return (
    <div className="h-screen flex flex-col">
      <Header onSearch={handleSearch} searchActive={searchActive} onSearchClose={handleSearchClose} />

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <aside className="hidden lg:flex flex-col w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[var(--card)]">
          <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">快速导航</h2>
            <div className="flex gap-1">
              <button
                onClick={() => handleUploadRequest()}
                className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors"
                title="上传文件"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNewFileRequest()}
                className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors"
                title="新建文件"
              >
                <FilePlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNewFolderRequest()}
                className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors"
                title="新建文件夹"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {parentPath !== null && (
              <button
                onClick={handleGoBack}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--accent)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回上级
              </button>
            )}

            {items
              .filter((item) => item.type === 'directory')
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--accent)] transition-colors ${
                    currentPath === item.path ? 'bg-[var(--accent)]' : ''
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 移动端：预览/编辑模式下显示返回按钮 */}
          {viewMode !== 'browse' ? (
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[var(--border)] bg-[var(--card)] lg:hidden shrink-0">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setViewMode('browse');
                }}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-[var(--accent)] transition-colors touch-target"
              >
                <ChevronLeft className="w-4 h-4" />
                返回
              </button>
              <span className="text-sm text-[var(--muted-foreground)] truncate">{selectedItem?.name}</span>
            </div>
          ) : (
            <Breadcrumb
              path={currentPath}
              onNavigate={handleNavigate}
              actions={
                <div className="flex gap-1 lg:hidden">
                  <button
                    onClick={() => handleUploadRequest()}
                    className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors touch-target"
                    title="上传文件"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleNewFileRequest()}
                    className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors touch-target"
                    title="新建文件"
                  >
                    <FilePlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleNewFolderRequest()}
                    className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors touch-target"
                    title="新建文件夹"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </div>
              }
            />
          )}

          <div className="flex-1 flex overflow-hidden">
            {/* 文件列表 */}
            <div
              className={`${
                viewMode !== 'browse' ? 'hidden lg:block lg:w-1/3' : 'w-full'
              } h-full overflow-auto border-r border-[var(--border)]`}
            >
              {searchActive ? (
                <SearchResults
                  query={searchQuery}
                  results={searchResults}
                  total={searchTotal}
                  loading={searchLoading}
                  onSelect={handleSearchSelect}
                  onClose={handleSearchClose}
                />
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
                  <AlertCircle className="w-8 h-8" />
                  <p>{error}</p>
                  <button
                    onClick={() => loadDirectory(currentPath)}
                    className="px-4 py-2 text-sm rounded bg-[var(--primary)] text-[var(--primary-foreground)]"
                  >
                    重试
                  </button>
                </div>
              ) : (
                <FileList
                  items={items}
                  onItemClick={handleItemClick}
                  selectedPath={selectedItem?.path}
                  onPreview={(item) => {
                    setSelectedItem(item);
                    setViewMode('preview');
                  }}
                  onEdit={(item) => handleEdit(item)}
                  onRename={(item) => handleRenameRequest(item)}
                  onCopy={(item) => handleCopyRequest(item)}
                  onMove={(item) => handleMoveRequest(item)}
                  onDelete={(item) => handleDeleteRequest(item)}
                  onDownload={(item) => handleDownload(item)}
                  onUpload={(dir) => handleUploadRequest(dir)}
                  onNewFile={(dir) => handleNewFileRequest(dir)}
                  onNewFolder={(dir) => handleNewFolderRequest(dir)}
                />
              )}
            </div>

            {/* 预览/编辑区 */}
            {viewMode !== 'browse' && selectedItem && (
              <div className="flex-1 h-full overflow-hidden">
                {viewMode === 'edit' && editContent !== null ? (
                  <FileEditor
                    file={selectedItem}
                    initialContent={editContent}
                    initialEncoding={editEncoding}
                    detectedEncoding={editDetectedEncoding}
                    onClose={handleCloseEditor}
                    onSave={handleSave}
                    onRename={() => handleRenameRequest()}
                  />
                ) : editLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                  </div>
                ) : (
                  <FilePreview
                    file={selectedItem}
                    onEdit={isTextFile(selectedItem.extension) ? () => handleEdit() : undefined}
                    onRename={() => handleRenameRequest()}
                    onDownload={() => handleDownload()}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ===== Dialogs ===== */}

      {/* 重命名 */}
      {renameTarget && (
        <RenameDialog
          currentName={renameTarget.name}
          isDirectory={renameTarget.type === 'directory'}
          onConfirm={handleRenameConfirm}
          onCancel={() => setRenameTarget(null)}
          loading={renameLoading}
          error={renameError}
        />
      )}

      {/* 新建文件/文件夹 */}
      {newFileDialog && (
        <NewFileDialog
          type={newFileDialog.type}
          currentPath={newFileDialog.dir}
          onConfirm={handleNewFileConfirm}
          onCancel={() => setNewFileDialog(null)}
          loading={newFileLoading}
          error={newFileError}
        />
      )}

      {/* 删除确认 */}
      {deleteTarget && (
        <ConfirmDialog
          title="确认删除"
          message={
            deleteTarget.type === 'directory'
              ? `确定要删除文件夹「${deleteTarget.name}」及其所有内容吗？此操作不可恢复。`
              : `确定要删除文件「${deleteTarget.name}」吗？此操作不可恢复。`
          }
          confirmLabel="删除"
          cancelLabel="取消"
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      {/* 复制 */}
      {copyTarget && (
        <FolderPickerDialog
          title="复制到"
          mode="copy"
          sourceName={copyTarget.name}
          currentPath={currentPath}
          onConfirm={handleCopyConfirm}
          onCancel={() => setCopyTarget(null)}
          loading={copyMoveLoading}
          error={copyMoveError}
        />
      )}

      {/* 移动 */}
      {moveTarget && (
        <FolderPickerDialog
          title="移动到"
          mode="move"
          sourceName={moveTarget.name}
          currentPath={currentPath}
          onConfirm={handleMoveConfirm}
          onCancel={() => setMoveTarget(null)}
          loading={copyMoveLoading}
          error={copyMoveError}
        />
      )}

      {/* 上传 */}
      {uploadTargetDir !== null && (
        <UploadDialog
          targetDir={uploadTargetDir}
          onConfirm={handleUploadConfirm}
          onCancel={() => setUploadTargetDir(null)}
        />
      )}
    </div>
  );
}
