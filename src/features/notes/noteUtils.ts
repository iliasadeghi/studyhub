import GithubSlugger from 'github-slugger';
import type { Note } from '@/types';

/** Group notes by unit; newest units (higher numbers) first. */
export function groupByUnit(notes: Note[]): [string, Note[]][] {
  const map = new Map<string, Note[]>();
  for (const n of notes) map.set(n.unit || 'General', [...(map.get(n.unit || 'General') ?? []), n]);
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }));
}

export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

/** Strip simple inline markdown so heading text matches what rehype-slug sees. */
function plain(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim();
}

/** Extract h2/h3 headings with the same slugs rehype-slug generates. */
export function extractToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let inCode = false;
  for (const line of markdown.split('\n')) {
    if (line.trim().startsWith('```')) inCode = !inCode;
    if (inCode) continue;
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!m) continue;
    const text = plain(m[2]);
    const id = slugger.slug(text);
    if (m[1].length === 2 || m[1].length === 3)
      entries.push({ id, text, depth: m[1].length as 2 | 3 });
  }
  return entries;
}

/** A short plain-text excerpt around the first match of `query`. */
export function snippet(content: string, query: string, radius = 60): string {
  const text = content.replace(/[#>*_`|-]+/g, ' ').replace(/\s+/g, ' ');
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text.slice(0, radius * 2);
  const start = Math.max(0, i - radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, i + query.length + radius)}…`;
}
