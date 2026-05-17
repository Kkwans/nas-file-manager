'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
// Base hljs styles only — colors are controlled via globals.css (.hljs-keyword etc.)
import 'highlight.js/styles/github.css';
import { getMonacoLanguage } from '@/lib/file-utils';

interface CodePreviewProps {
  content: string;
  extension: string;
}

export function CodePreview({ content, extension }: CodePreviewProps) {
  const codeRef = useRef<HTMLElement>(null);
  const language = getMonacoLanguage(extension);
  const lines = content.split('\n');

  useEffect(() => {
    if (codeRef.current) {
      // 清除之前的高亮
      codeRef.current.removeAttribute('data-highlighted');
      // 设置语言
      codeRef.current.className = `language-${language}`;
      // 执行高亮
      hljs.highlightElement(codeRef.current);
    }
  }, [content, language]);

  return (
    <div className="h-full overflow-auto font-mono text-sm">
      <div className="flex">
        {/* 行号 */}
        <div className="shrink-0 text-right pr-4 py-4 pl-4 text-[var(--muted-foreground)] select-none border-r border-[var(--border)]">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* 代码内容（带语法高亮）*/}
        <div className="flex-1 overflow-x-auto py-4 px-4">
          <pre className="leading-6" style={{ background: 'transparent', margin: 0, padding: 0 }}>
            <code ref={codeRef} className={`language-${language}`}>
              {content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
