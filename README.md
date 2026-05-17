# NAS 文件管理系统

> 绿联 NAS 文件管理增强工具，支持多格式文件预览和在线编辑。

## 功能特性

### 文件预览
- **Markdown**: 渲染为美观的 HTML（支持表格、代码块、图片等）
- **代码文件**: 语法高亮（支持 100+ 种语言）
- **图片**: 内联预览（jpg, png, gif, webp, svg）
- **视频/音频**: 内联播放
- **PDF**: 内联查看

### 文件编辑
- 所有文本文件支持在线编辑
- Markdown 实时预览（编辑/预览分屏）
- 文件名、扩展名、编码格式编辑
- 语法高亮、自动补全

### 其他功能
- 移动端 + PC 端自适应
- 暗色/亮色主题切换
- 文件操作（新建、删除、重命名、复制、移动、上传、下载）

## 技术栈

- **前端**: Next.js 16 + TypeScript + Tailwind CSS
- **编辑器**: Monaco Editor（VS Code 内核）
- **Markdown**: react-markdown + rehype/remark
- **代码高亮**: rehype-highlight（Prism.js）

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### Docker 部署

```bash
# 构建镜像
docker build -t nas-file-manager .

# 运行容器
docker run -d \
  --name nas-file-manager \
  -p 3002:3000 \
  -v /volume1:/data:ro \
  nas-file-manager
```

## 目录结构

```
nas-file-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 首页（文件浏览）
│   │   ├── edit/              # 编辑页面
│   │   └── api/               # API Routes
│   ├── components/            # React 组件
│   │   ├── FileBrowser/       # 文件浏览组件
│   │   ├── FilePreview/       # 文件预览组件
│   │   ├── FileEditor/        # 文件编辑组件
│   │   └── common/            # 公共组件
│   ├── lib/                   # 工具函数
│   ├── hooks/                 # React Hooks
│   └── types/                 # TypeScript 类型
├── public/                    # 静态资源
├── Dockerfile                 # Docker 构建
└── docker-compose.yml         # Docker Compose
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_ROOT_PATH` | `/data` | 文件系统根目录 |
| `NEXT_PUBLIC_AUTH_ENABLED` | `false` | 是否启用认证 |

## 关联任务

- **任务文档**: tasks/2026-05/0517_11-NAS文件管理系统/
- **部署目录**: /volume1/Docker/NAS-FileManager/

## 许可证

MIT
