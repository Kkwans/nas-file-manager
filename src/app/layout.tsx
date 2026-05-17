import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'NAS 文件管理器',
  description: 'NAS 文件浏览、预览和编辑工具',
  icons: {
    icon: '/favicon.ico',
  },
  other: {
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="h-screen overflow-hidden">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
