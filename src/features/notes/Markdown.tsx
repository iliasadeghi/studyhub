import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { cn } from '@/utils/cn';
import { withBase } from '@/utils/basePath';

/** Renders note Markdown with GFM (tables, task lists) and heading anchors. */
export function Markdown({
  content,
  scale = 1,
  className,
}: {
  content: string;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={cn('md', className)} style={{ ['--note-scale' as string]: scale }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          a: ({ node: _node, children, ...props }) =>
            props.href?.startsWith('http') ? (
              <a {...props} target="_blank" rel="noreferrer">
                {children}
              </a>
            ) : (
              <a {...props}>{children}</a>
            ),
          img: ({ node: _node, alt, src, ...props }) => (
            <img {...props} src={withBase(src)} alt={alt ?? ''} loading="lazy" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
