// Helpers for building elements. Text is always set with textContent, never innerHTML,
// so whatever a visitor types can't turn into HTML or scripts.

type Child = Node | string | number | null | undefined | false;

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | boolean | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    el.setAttribute(name, value === true ? '' : value);
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }

  return el;
}

// Plain text, but http(s) links become clickable.
export function textWithLinks(text: string): Node[] {
  const nodes: Node[] = [];
  const linkPattern = /\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g;
  let position = 0;

  for (const match of text.matchAll(linkPattern)) {
    nodes.push(document.createTextNode(text.slice(position, match.index)));
    nodes.push(element('a', { href: match[0], target: '_blank', rel: 'noopener nofollow', class: 'link' }, match[0]));
    position = match.index! + match[0].length;
  }
  nodes.push(document.createTextNode(text.slice(position)));

  return nodes;
}

const twoDigits = (n: number) => String(n).padStart(2, '0');

// "2026-09-27 14:05" in the visitor's own time zone.
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
  return `${day} ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}

export function formatDate(iso: string): string {
  return formatDateTime(iso).slice(0, 10);
}

export function formValues(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of new FormData(form)) {
    if (typeof value === 'string') values[name] = value.trim();
  }
  return values;
}

// Writes into the form's [data-form-message] line.
export function showFormMessage(form: HTMLElement, message: string, isError = false): void {
  const line = form.querySelector('[data-form-message]');
  if (!line) return;
  line.textContent = message;
  line.classList.toggle('is-error', isError);
}
