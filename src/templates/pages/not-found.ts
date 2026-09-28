import { html } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';

export function notFoundPage(context: BuildContext): string {
  const content = html`
    <div class="flex flex-col items-start gap-6">
      <h1 class="font-pixel text-[32px]">404</h1>
      <a href="/" class="link meta">home</a>
    </div>
  `;

  return renderPage(context, { path: '/404.html', title: '404', hideFromSearch: true }, content);
}
