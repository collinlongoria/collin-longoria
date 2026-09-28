// Brand icons from Simple Icons (https://simpleicons.org). To add one, import it here and
// give it a name, then use that name as `icon` in socialLinks (src/config.ts).

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

export type IconName = keyof typeof icons;

export function socialIcon(name: IconName): SafeHtml {
  return html`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    ${rawHtml(`<path d="${icons[name].path}"/>`)}
  </svg>`;
}
