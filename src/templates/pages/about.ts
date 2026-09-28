import { html, rawHtml } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { mediaTag } from '../media.ts';
import { pageTitle } from '../ui.ts';

export function aboutPage(context: BuildContext): string {
  const { about } = context.content;

  const content = html`
    <div class="flex max-w-[680px] flex-col gap-8">
      ${pageTitle('About Me')}
      ${
        about.image &&
        html`<div class="overflow-hidden rounded border border-line">
        ${mediaTag(about.image, { sizes: '680px', priority: true, className: 'w-full' })}
      </div>`
      }
      <div class="prose">${rawHtml(about.body.html)}</div>
    </div>
  `;

  return renderPage(
    context,
    { path: '/about/', title: 'About Me', activeNav: 'about', description: about.body.excerpt || undefined },
    content,
  );
}
