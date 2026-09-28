// Brand icons from Simple Icons (https://simpleicons.org). To add one, import it here and
// give it a name, then use that name as `icon` in socialLinks (src/config.ts).
//
// For brands Simple Icons doesn't carry (LinkedIn, for one), drop an SVG in src/icons/,
// e.g. src/icons/linkedin.svg, and use its file name as the icon: `icon: 'linkedin'`.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { siBluesky, siGithub, siItchdotio, siSteam, siThreads, siX, siYoutube } from 'simple-icons';
import { html, rawHtml, type SafeHtml } from '../lib/html.ts';

const icons = {
  x: siX,
  threads: siThreads,
  github: siGithub,
  itch: siItchdotio,
  steam: siSteam,
  bluesky: siBluesky,
  youtube: siYoutube,
};

const ICON_DIR = path.resolve(import.meta.dirname, '../icons');

export type IconName = keyof typeof icons | (string & {});

export function socialIcon(name: IconName): SafeHtml {
  if (name in icons) {
    return html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      ${rawHtml(`<path d="${icons[name as keyof typeof icons].path}"/>`)}
    </svg>`;
  }
  return rawHtml(customIcon(name));
}

// Swap the file's own size and color for ours so it matches the other icons.
function customIcon(name: string): string {
  const file = path.join(ICON_DIR, `${name}.svg`);
  let svg: string;
  try {
    svg = readFileSync(file, 'utf8');
  } catch {
    throw new Error(`No icon called "${name}". Add ${file} or use one from social-icons.ts.`);
  }

  return svg
    .replace(/<\?xml[^>]*>|<!--[\s\S]*?-->/g, '')
    .replace(/\sfill="(?!none")[^"]*"/g, '')
    .replace(/<svg\b([^>]*)>/, (_, attributes: string) => {
      const kept = attributes.replace(/\s(width|height|class|style)="[^"]*"/g, '');
      return `<svg${kept} width="18" height="18" fill="currentColor" aria-hidden="true">`;
    })
    .trim();
}
