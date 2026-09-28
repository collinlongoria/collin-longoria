import { Marked, type Token, type Tokens } from 'marked';
import { bundledLanguages, createHighlighter, type Highlighter } from 'shiki';
import type { Media } from './images.ts';
import { escapeHtml } from './html.ts';
import { mediaTag } from '../templates/media.ts';
import { slugify } from '../shared/schema.ts';

export interface RenderedMarkdown {
  html: string;
  excerpt: string;
  wordCount: number;
  firstMedia: Media | null;
}

// Turns a relative path like "shot.png" into processed media. Returns null for
// anything that isn't a file next to the markdown (external links, absolute paths).
export type MediaResolver = (href: string) => Promise<Media | null>;

let highlighter: Promise<Highlighter> | null = null;

async function highlightCode(code: string, language = ''): Promise<string> {
  highlighter ??= createHighlighter({ themes: ['vitesse-black'], langs: [] });
  const shiki = await highlighter;

  const lang = language.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  const known = lang in bundledLanguages;
  if (known && !shiki.getLoadedLanguages().includes(lang)) {
    await shiki.loadLanguage(lang as keyof typeof bundledLanguages);
  }

  return shiki.codeToHtml(code, { lang: known ? lang : 'text', theme: 'vitesse-black' });
}

export function plainText(tokens: Token[]): string {
  let text = '';
  for (const token of tokens) {
    if (token.type === 'code' || token.type === 'html' || token.type === 'image') continue;

    if (token.type === 'list') {
      text += plainText((token as Tokens.List).items.flatMap((item) => item.tokens));
    } else if ('tokens' in token && token.tokens?.length) {
      text += plainText(token.tokens);
    } else if ('text' in token && typeof token.text === 'string') {
      text += token.text;
    }

    if (token.type === 'paragraph' || token.type === 'heading' || token.type === 'space') {
      text += '\n';
    }
  }
  return text;
}

function firstParagraph(tokens: Token[], maxLength = 240): string {
  for (const token of tokens) {
    if (token.type !== 'paragraph') continue;

    const text = plainText([token]).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
  }
  return '';
}

function isExternal(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:');
}

export async function renderMarkdown(source: string, resolveMedia: MediaResolver): Promise<RenderedMarkdown> {
  const marked = new Marked({ gfm: true });
  const tokens = marked.lexer(source);

  // marked renders synchronously, so do the slow async work (image processing,
  // syntax highlighting) up front and look the results up while rendering.
  const media = new Map<string, Media | null>();
  const highlighted = new Map<Token, string>();
  const work: Promise<unknown>[] = [];
  let firstImage: string | null = null;

  marked.walkTokens(tokens, (token) => {
    if (token.type === 'image') {
      const { href } = token as Tokens.Image;
      firstImage ??= href;
      if (!media.has(href)) {
        media.set(href, null);
        work.push(resolveMedia(href).then((result) => media.set(href, result)));
      }
    }
    if (token.type === 'code') {
      const { text, lang } = token as Tokens.Code;
      work.push(highlightCode(text, lang).then((result) => highlighted.set(token, result)));
    }
  });
  await Promise.all(work);

  const usedIds = new Set<string>();

  marked.use({
    renderer: {
      image({ href, title, text }) {
        const file = media.get(href);
        const tag = file
          ? mediaTag(file, { alt: text, sizes: '(min-width: 1024px) 680px, 100vw' }).value
          : `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy">`;

        if (!title) return tag;
        return `<span class="figure">${tag}<span class="caption">${escapeHtml(title)}</span></span>`;
      },

      code(token) {
        return highlighted.get(token) ?? `<pre><code>${escapeHtml(token.text)}</code></pre>`;
      },

      heading({ tokens: inline, depth }) {
        const base = slugify(plainText(inline)) || 'section';
        let id = base;
        for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
        usedIds.add(id);
        return `<h${depth} id="${id}">${this.parser.parseInline(inline)}</h${depth}>\n`;
      },

      link({ href, title, tokens: inline }) {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const newTab = isExternal(href) ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${newTab}>${this.parser.parseInline(inline)}</a>`;
      },
    },
  });

  return {
    html: marked.parser(tokens),
    excerpt: firstParagraph(tokens),
    wordCount: plainText(tokens).split(/\s+/).filter(Boolean).length,
    firstMedia: firstImage ? (media.get(firstImage) ?? null) : null,
  };
}
