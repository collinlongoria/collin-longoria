// Screenplays are written in Fountain (https://fountain.io), plain text with a few
// conventions: "INT. DINER - NIGHT" is a scene heading, an all-caps line followed by
// text is a character and their dialogue, and so on. This handles the common parts.

import { escapeHtml } from './html.ts';
import { coverPage, typstString, type CoverImage } from './pdf.ts';

export type ScriptElement =
  | { type: 'scene'; text: string }
  | { type: 'action'; text: string; centered?: boolean }
  | { type: 'character'; text: string }
  | { type: 'parenthetical'; text: string }
  | { type: 'dialogue'; text: string }
  | { type: 'lyric'; text: string }
  | { type: 'transition'; text: string }
  | { type: 'page-break' };

export interface Script {
  titlePage: Record<string, string>;
  elements: ScriptElement[];
}

const SCENE_HEADING = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[.\s]/i;

function isAllCaps(text: string): boolean {
  return /[A-Z]/.test(text) && text === text.toUpperCase();
}

function readTitlePage(block: string): Record<string, string> {
  const titlePage: Record<string, string> = {};
  let currentKey = '';

  for (const line of block.split('\n')) {
    const match = /^([A-Za-z][A-Za-z ]*):\s*(.*)$/.exec(line);
    if (match && !line.startsWith(' ')) {
      currentKey = match[1]!.trim().toLowerCase();
      titlePage[currentKey] = match[2]!.trim();
    } else if (currentKey) {
      // Indented lines continue the previous value (e.g. a multi-line address).
      const previous = titlePage[currentKey];
      titlePage[currentKey] = previous ? `${previous}\n${line.trim()}` : line.trim();
    }
  }

  return titlePage;
}

export function parseFountain(source: string): Script {
  let text = source
    .replace(/\r\n?/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '') // /* boneyard */
    .replace(/\[\[[\s\S]*?\]\]/g, ''); // [[notes]]

  let titlePage: Record<string, string> = {};
  const firstBlock = text.split(/\n\s*\n/)[0] ?? '';
  if (/^[A-Za-z][A-Za-z ]*:/.test(firstBlock)) {
    titlePage = readTitlePage(firstBlock);
    text = text.slice(firstBlock.length);
  }

  const elements: ScriptElement[] = [];

  for (const rawBlock of text.split(/\n[ \t]*\n/)) {
    const block = rawBlock.replace(/^\n+|\s+$/g, '');
    if (!block.trim()) continue;

    const lines = block.split('\n');
    const first = lines[0]!.trim();

    if (/^={3,}$/.test(first)) {
      elements.push({ type: 'page-break' });
      continue;
    }

    // "# Section" and "= synopsis" lines are notes for the writer, not part of the script.
    if (first.startsWith('#') || first.startsWith('=')) continue;

    if (lines.length === 1) {
      const forcedScene = first.startsWith('.') && !first.startsWith('..');
      if (forcedScene || SCENE_HEADING.test(first)) {
        const withoutNumber = first.replace(/\s*#[^#]+#\s*$/, '');
        elements.push({ type: 'scene', text: withoutNumber.replace(/^\./, '').trim() });
        continue;
      }
      if (first.startsWith('>') && first.endsWith('<')) {
        elements.push({ type: 'action', text: first.slice(1, -1).trim(), centered: true });
        continue;
      }
      if (first.startsWith('>') || (isAllCaps(first) && first.endsWith('TO:'))) {
        elements.push({ type: 'transition', text: first.replace(/^>\s*/, '') });
        continue;
      }
    }

    if (lines.every((line) => line.trim().startsWith('~'))) {
      for (const line of lines) elements.push({ type: 'lyric', text: line.trim().slice(1).trim() });
      continue;
    }

    const forcedCharacter = first.startsWith('@');
    const name = forcedCharacter ? first.slice(1) : first;
    const looksLikeCharacter = isAllCaps(name.replace(/\(.*?\)/g, ''));

    if (lines.length > 1 && !first.startsWith('!') && (forcedCharacter || looksLikeCharacter)) {
      // "^" marks dual dialogue; we just show it as regular dialogue.
      elements.push({ type: 'character', text: name.replace(/\^\s*$/, '').trim() });

      let speech: string[] = [];
      const flushSpeech = () => {
        if (speech.length) elements.push({ type: 'dialogue', text: speech.join('\n') });
        speech = [];
      };

      for (const line of lines.slice(1)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          flushSpeech();
          elements.push({ type: 'parenthetical', text: trimmed });
        } else {
          speech.push(trimmed);
        }
      }
      flushSpeech();
      continue;
    }

    elements.push({ type: 'action', text: lines.map((line) => line.replace(/^!/, '')).join('\n') });
  }

  return { titlePage, elements };
}

interface Span {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

// *italic*, **bold**, ***both***, _underline_
function splitEmphasis(text: string): Span[] {
  const spans: Span[] = [];
  let bold = false;
  let italic = false;
  let underline = false;
  let current = '';

  const push = () => {
    if (current) spans.push({ text: current, bold, italic, underline });
    current = '';
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;

    if (char === '\\' && i + 1 < text.length) {
      current += text[++i];
    } else if (char === '*') {
      let stars = 1;
      while (text[i + stars] === '*' && stars < 3) stars++;
      push();
      if (stars !== 2) italic = !italic;
      if (stars >= 2) bold = !bold;
      i += stars - 1;
    } else if (char === '_') {
      push();
      underline = !underline;
    } else {
      current += char;
    }
  }
  push();

  return spans;
}

function toHtml(text: string): string {
  return splitEmphasis(text)
    .map((span) => {
      let result = escapeHtml(span.text).replace(/\n/g, '<br>');
      if (span.underline) result = `<u>${result}</u>`;
      if (span.italic) result = `<em>${result}</em>`;
      if (span.bold) result = `<strong>${result}</strong>`;
      return result;
    })
    .join('');
}

export function scriptToHtml(script: Script): string {
  const parts = script.elements.map((element) => {
    if (element.type === 'page-break') return '<hr class="sp-break">';

    const centered = element.type === 'action' && element.centered ? ' sp-centered' : '';
    return `<p class="sp-${element.type}${centered}">${toHtml(element.text)}</p>`;
  });

  return `<div class="screenplay">\n${parts.join('\n')}\n</div>`;
}

function toTypst(text: string): string {
  return splitEmphasis(text)
    .map((span) => {
      let result = span.text
        .split('\n')
        .map((line) => `#${typstString(line)}`)
        .join('#linebreak()');
      if (span.underline) result = `#underline[${result}]`;
      if (span.italic) result = `#emph[${result}]`;
      if (span.bold) result = `#strong[${result}]`;
      return result;
    })
    .join('');
}

// Standard US screenplay layout: Courier 12pt, 1.5" left margin, dialogue indented 1".
export function scriptToTypst(
  script: Script,
  fallbackTitle: string,
  fallbackAuthor: string,
  cover?: CoverImage,
): string {
  const title = script.titlePage['title'] ?? fallbackTitle;
  const author = script.titlePage['author'] ?? script.titlePage['authors'] ?? fallbackAuthor;
  const credit = script.titlePage['credit'] ?? 'Written by';
  const contact = script.titlePage['contact'];

  const lines = [
    `#set document(title: ${typstString(title.replace(/[*_]/g, ''))}, author: ${typstString(author)})`,
    `#set page(paper: "us-letter")`,
    `#set text(font: "Courier Prime", size: 12pt)`,
    `#set par(leading: 0.5em, spacing: 1em)`,
    '',
    `#let scene(body) = block(above: 2em, below: 1em, sticky: true, upper(body))`,
    `#let action(body) = block(above: 1em, below: 1em, body)`,
    `#let character(body) = block(above: 1em, below: 0.5em, sticky: true, pad(left: 2.2in, upper(body)))`,
    `#let parenthetical(body) = block(above: 0pt, below: 0.5em, sticky: true, pad(left: 1.6in, block(width: 2in, body)))`,
    `#let dialogue(body) = block(above: 0pt, below: 1em, pad(left: 1in, block(width: 3.5in, body)))`,
    `#let transition(body) = block(above: 1em, below: 1em, width: 100%, align(right, upper(body)))`,
    `#let centered(body) = block(above: 1em, below: 1em, width: 100%, align(center, body))`,
    `#let lyric(body) = block(above: 0pt, below: 0pt, pad(left: 1in, emph(body)))`,
    '',
    cover ? coverPage(cover) : '',
    `#page(margin: 1in)[`,
    `  #v(3in)`,
    `  #align(center)[#upper[#strong[${toTypst(title)}]] #v(1em) ${toTypst(credit)} #v(1em) ${toTypst(author)}]`,
    contact ? `  #place(bottom + left)[${toTypst(contact)}]` : '',
    `  #counter(page).update(0)`,
    `]`,
    '',
    // Page 1 has no number, later pages get "2." in the top right, like a real script.
    `#set page(margin: (left: 1.5in, right: 1in, top: 1in, bottom: 1in), header: context {`,
    `  if counter(page).get().first() > 1 { align(right)[#counter(page).display().] }`,
    `})`,
    '',
  ];

  for (const element of script.elements) {
    if (element.type === 'page-break') {
      lines.push('#pagebreak()');
    } else if (element.type === 'action') {
      lines.push(`#${element.centered ? 'centered' : 'action'}[${toTypst(element.text)}]`);
    } else {
      lines.push(`#${element.type}[${toTypst(element.text)}]`);
    }
  }

  return lines.join('\n');
}
