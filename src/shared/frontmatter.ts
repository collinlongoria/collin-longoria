// The "---" block at the top of a markdown file.

import { parse, stringify } from 'yaml';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function readFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const match = FRONTMATTER.exec(text);
  if (!match) return { data: {}, body: text };

  const data = (parse(match[1]!) ?? {}) as Record<string, unknown>;
  const body = text.slice(match[0].length).replace(/^\r?\n/, '');
  return { data, body };
}

export function writeFrontmatter(data: Record<string, unknown>, body: string): string {
  const kept: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const empty = value === undefined || value === null || value === '' || value === false;
    const emptyList = Array.isArray(value) && value.length === 0;
    if (!empty && !emptyList) kept[key] = value;
  }

  const text = body.trim() + '\n';
  if (Object.keys(kept).length === 0) return text;

  return `---\n${stringify(kept, { lineWidth: 0 }).trimEnd()}\n---\n\n${text}`;
}
