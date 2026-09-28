import { html } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { pageTitle } from '../ui.ts';

// The editor itself is built by src/scripts/admin/editor.ts.
export function adminPage(context: BuildContext): string {
  const content = html`
    <div class="flex flex-col gap-8">
      ${pageTitle('Admin')}
      <p class="logged-out-only">
        <button type="button" class="button button-primary" data-open-login>Log in</button>
      </p>
      <div class="admin-only flex flex-col gap-6" data-admin></div>
    </div>
  `;

  return renderPage(context, { path: '/admin/', title: 'Admin', hideFromSearch: true }, content);
}
