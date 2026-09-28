// Small bits of markup that show up on lots of pages.

import { html, type SafeHtml } from '../lib/html.ts';
import type { Media } from '../lib/images.ts';
import { mediaTag } from './media.ts';

export function pageTitle(text: string): SafeHtml {
  return html`<h1 class="page-title">${text}</h1>`;
}

export function sectionHeader(title: string, allLink?: string): SafeHtml {
  return html`
    <div class="flex items-center justify-between gap-3">
      <h2 class="section-title">${title}</h2>
      ${allLink && html`<a href="${allLink}" class="meta text-fg-2 hover:text-fg">all →</a>`}
    </div>
  `;
}

export function tag(text: string): SafeHtml {
  return html`<span class="tag">${text}</span>`;
}

export function tagList(tags: string[]): SafeHtml {
  if (tags.length === 0) return html``;
  return html`<div class="flex flex-wrap gap-1.5">${tags.map(tag)}</div>`;
}

export function backLink(label: string, href: string): SafeHtml {
  return html`<a href="${href}" class="meta text-fg-2 hover:text-fg">← ${label}</a>`;
}

export function linkButton(label: string, href: string, style: 'primary' | 'secondary' = 'primary'): SafeHtml {
  const external = href.startsWith('http');
  return html`<a
    href="${href}"
    class="button button-${style}"
    ${external && html`target="_blank" rel="noopener"`}
    >${label}</a
  >`;
}

// aspect is a Tailwind class like "aspect-[2/3]".
export function framedImage(
  media: Media | undefined,
  aspect: string,
  options: { alt?: string; sizes?: string; priority?: boolean } = {},
): SafeHtml {
  return html`<div class="frame ${aspect}">${media && mediaTag(media, options)}</div>`;
}

export function filterChips(options: { value: string; label: string }[]): SafeHtml {
  if (options.length < 2) return html``;

  return html`
    <div class="flex flex-wrap gap-2" data-filters>
      <button type="button" class="chip" data-filter="" aria-pressed="true">all</button>
      ${options.map(
        (option) =>
          html`<button type="button" class="chip" data-filter="${option.value}" aria-pressed="false">
            ${option.label}
          </button>`,
      )}
    </div>
  `;
}

interface InputOptions {
  type?: string;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
  rows?: number;
  autocomplete?: string;
}

export function formField(label: string, name: string, options: InputOptions = {}): SafeHtml {
  const id = `field-${name}`;

  const input = options.multiline
    ? html`<textarea
        id="${id}"
        name="${name}"
        class="input"
        rows="${options.rows ?? 5}"
        ${options.required && html`required`}
        ${options.maxLength && html`maxlength="${options.maxLength}"`}
      ></textarea>`
    : html`<input
        id="${id}"
        name="${name}"
        type="${options.type ?? 'text'}"
        class="input"
        ${options.required && html`required`}
        ${options.maxLength && html`maxlength="${options.maxLength}"`}
        ${options.autocomplete && html`autocomplete="${options.autocomplete}"`}
      />`;

  return html`
    <div>
      <label for="${id}" class="label">${label}</label>
      ${input}
    </div>
  `;
}
