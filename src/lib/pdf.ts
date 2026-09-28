// Story PDFs via the Typst CLI (https://typst.app). Skipped when typst isn't installed;
// the deploy workflow always has it.

import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Lexer, type Token, type Tokens } from 'marked';
import { typstString } from './fountain.ts';

const TYPST = process.env.TYPST_BIN || 'typst';
const FONTS = path.resolve(import.meta.dirname, '../pdf-fonts');

let typstInstalled: boolean | undefined;

export function hasTypst(): boolean {
  if (typstInstalled === undefined) {
    typstInstalled = spawnSync(TYPST, ['--version']).status === 0;
  }
  return typstInstalled;
}

export async function makePdf(typstSource: string, outputFile: string): Promise<void> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'typst-'));
  try {
    const sourceFile = path.join(workDir, 'main.typ');
    await writeFile(sourceFile, typstSource);

    const result = spawnSync(TYPST, ['compile', '--font-path', FONTS, sourceFile, outputFile], {
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      throw new Error(`typst couldn't build ${outputFile}:\n${result.stderr}`);
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

// Straight quotes look cheap in print; the web version keeps them as typed.
function curlyQuotes(text: string): string {
  return text
    .replace(/(^|[\s([{—-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{—-])'/g, '$1‘')
    .replace(/'/g, '’')
    .replace(/--/g, '—');
}

function textToTypst(text: string): string {
  return '#' + typstString(curlyQuotes(text.replace(/\s*\n\s*/g, ' ')));
}

function inlineToTypst(tokens: Token[] = []): string {
  return tokens
    .map((token) => {
      switch (token.type) {
        case 'strong':
          return `#strong[${inlineToTypst((token as Tokens.Strong).tokens)}]`;
        case 'em':
          return `#emph[${inlineToTypst((token as Tokens.Em).tokens)}]`;
        case 'del':
          return `#strike[${inlineToTypst((token as Tokens.Del).tokens)}]`;
        case 'codespan':
          return `#raw(${typstString((token as Tokens.Codespan).text)})`;
        case 'br':
          return '#linebreak()';
        case 'link': {
          const link = token as Tokens.Link;
          return `#link(${typstString(link.href)})[${inlineToTypst(link.tokens)}]`;
        }
        case 'text': {
          const textToken = token as Tokens.Text;
          return textToken.tokens?.length ? inlineToTypst(textToken.tokens) : textToTypst(textToken.text);
        }
        case 'escape':
          return textToTypst((token as Tokens.Escape).text);
        default:
          return '';
      }
    })
    .join('');
}

function blocksToTypst(tokens: Token[]): string {
  const blocks: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'paragraph':
        blocks.push(inlineToTypst((token as Tokens.Paragraph).tokens));
        break;
      case 'heading':
        blocks.push(`#align(center)[#v(0.6em)#strong[${inlineToTypst((token as Tokens.Heading).tokens)}]#v(0.3em)]`);
        break;
      case 'hr':
        blocks.push('#align(center)[#v(0.4em)#"*   *   *"#v(0.4em)]');
        break;
      case 'blockquote':
        blocks.push(`#pad(left: 2em, right: 2em)[${blocksToTypst((token as Tokens.Blockquote).tokens)}]`);
        break;
      case 'list': {
        const items = (token as Tokens.List).items.map((item) => `[${blocksToTypst(item.tokens).trim()}]`);
        blocks.push(`#list(${items.join(', ')})`);
        break;
      }
      case 'text': {
        const textToken = token as Tokens.Text;
        blocks.push(textToken.tokens?.length ? inlineToTypst(textToken.tokens) : textToTypst(textToken.text));
        break;
      }
    }
  }

  return blocks.join('\n\n');
}

export interface ChapterText {
  title: string;
  markdown: string;
}

// A 6×9" book: title page, then each chapter starting on a new page.
export function proseToTypst(title: string, author: string, chapters: ChapterText[]): string {
  const lines = [
    `#set document(title: ${typstString(title)}, author: ${typstString(author)})`,
    `#set page(width: 6in, height: 9in, margin: (inside: 0.85in, outside: 0.7in, top: 0.8in, bottom: 0.9in))`,
    `#set text(font: "Libertinus Serif", size: 11pt, lang: "en", hyphenate: true)`,
    `#set par(justify: true, first-line-indent: 1.2em, leading: 0.68em, spacing: 0.68em)`,
    `#show heading.where(level: 1): set align(center)`,
    `#show heading.where(level: 1): set text(15pt, weight: "regular")`,
    `#show heading.where(level: 1): set block(above: 0pt, below: 0.5in)`,
    '',
    `#page(numbering: none)[`,
    `  #align(center + horizon)[#text(24pt)[${textToTypst(title)}] #v(1.2em) #text(12pt)[${textToTypst(author)}]]`,
    `  #counter(page).update(0)`,
    `]`,
    `#set page(numbering: "1", number-align: center)`,
    '',
  ];

  for (const chapter of chapters) {
    if (chapters.length > 1) {
      lines.push('#pagebreak(weak: true)', '#v(1.1in)', `#heading(level: 1)[${textToTypst(chapter.title)}]`);
    }
    lines.push(blocksToTypst(new Lexer({ gfm: true }).lex(chapter.markdown)), '');
  }

  return lines.join('\n');
}
