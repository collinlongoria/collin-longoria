// Builds the form inputs for an entry's fields (title, date, tags…) from src/shared/schema.ts.
// Each input writes straight into `values` as you type.

import { element } from '../dom.ts';
import type { Field } from '../../shared/schema.ts';

type Values = Record<string, unknown>;

interface Link {
  label: string;
  url: string;
}

function linksToText(links: unknown): string {
  if (!Array.isArray(links)) return '';
  return (links as Link[]).map((link) => `${link.label} | ${link.url}`).join('\n');
}

function textToLinks(text: string): Link[] {
  return text
    .split('\n')
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter(([label, url]) => label || url)
    .map(([label = '', url = '']) => ({ label: label || url, url: url || label }));
}

export function fieldInput(field: Field, values: Values, onChange: () => void): HTMLElement {
  const id = `field-${field.key}`;
  const current = values[field.key];

  function set(value: unknown) {
    values[field.key] = value;
    onChange();
  }

  if (field.type === 'checkbox') {
    const checkbox = element('input', { id, type: 'checkbox', class: 'accent-accent', checked: current === true });
    checkbox.addEventListener('change', () => set(checkbox.checked));
    return element('label', { class: 'meta flex items-center gap-2 self-end pb-3 text-fg-2' }, checkbox, field.label);
  }

  let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

  switch (field.type) {
    case 'choice': {
      const select = element('select', { id, class: 'input' }, element('option', { value: '' }, '—'));
      for (const choice of field.choices ?? []) {
        select.append(element('option', { value: choice, selected: current === choice }, choice));
      }
      select.addEventListener('change', () => set(select.value));
      input = select;
      break;
    }

    case 'longtext':
    case 'links': {
      const textarea = element('textarea', { id, class: 'input min-h-[76px]', rows: '3' });
      textarea.value = field.type === 'links' ? linksToText(current) : String(current ?? '');
      textarea.addEventListener('input', () => {
        set(field.type === 'links' ? textToLinks(textarea.value) : textarea.value);
      });
      input = textarea;
      break;
    }

    case 'list': {
      const text = element('input', { id, class: 'input' });
      text.value = Array.isArray(current) ? current.join(', ') : String(current ?? '');
      text.addEventListener('input', () => {
        set(
          text.value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        );
      });
      input = text;
      break;
    }

    case 'number': {
      const number = element('input', { id, type: 'number', class: 'input' });
      number.value = current === undefined ? '' : String(current);
      number.addEventListener('input', () => set(number.value === '' ? undefined : Number(number.value)));
      input = number;
      break;
    }

    case 'date': {
      const date = element('input', { id, type: 'date', class: 'input' });
      date.value = String(current ?? '').slice(0, 10);
      date.addEventListener('input', () => set(date.value));
      input = date;
      break;
    }

    default: {
      const text = element('input', { id, class: 'input' });
      text.value = String(current ?? '');
      text.addEventListener('input', () => set(text.value));
      input = text;
    }
  }

  if (field.hint) input.setAttribute('placeholder', field.hint);

  const wide = field.type === 'longtext' || field.type === 'links';
  return element(
    'div',
    { class: wide ? 'sm:col-span-2' : '' },
    element('label', { for: id, class: 'label' }, field.required ? `${field.label} *` : field.label),
    input,
  );
}
