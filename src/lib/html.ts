// A small templating helper. Anything you put inside ${} is HTML-escaped, unless it
// came from another html`` template (or rawHtml). That keeps user text from turning into markup.

export class SafeHtml {
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}

type TemplateValue = SafeHtml | string | number | boolean | null | undefined | TemplateValue[];

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: unknown): string {
  return String(text).replace(/[&<>"']/g, (char) => ESCAPES[char]!);
}

export function rawHtml(markup: string): SafeHtml {
  return new SafeHtml(markup);
}

function renderValue(value: TemplateValue): string {
  // Lets you write ${condition && html`...`} without printing "false".
  if (value === null || value === undefined || value === false || value === true) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return escapeHtml(value);
}

export function html(strings: TemplateStringsArray, ...values: TemplateValue[]): SafeHtml {
  let output = strings[0] ?? '';
  values.forEach((value, i) => {
    output += renderValue(value) + (strings[i + 1] ?? '');
  });
  return new SafeHtml(output);
}
