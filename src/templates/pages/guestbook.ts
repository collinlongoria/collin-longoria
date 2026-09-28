import { html } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { formField, pageTitle } from '../ui.ts';

// Entries are loaded by src/scripts/guestbook.ts.
export function guestbookPage(context: BuildContext): string {
  const content = html`
    <div class="flex flex-col gap-10">
      ${pageTitle('Guestbook')}

      <div class="grid gap-12 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
        <form class="panel flex h-fit flex-col gap-4 p-5 lg:sticky lg:top-8" data-guestbook-form>
          ${formField('name', 'name', { required: true, maxLength: 60, autocomplete: 'nickname' })}
          ${formField('location', 'location', { maxLength: 60 })}
          ${formField('message', 'message', { multiline: true, required: true, maxLength: 1000 })}
          <div data-turnstile></div>

          <!-- Spam trap: hidden from people, but bots fill it in. -->
          <input type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true" />

          <div class="flex items-center gap-3">
            <button type="submit" class="button button-primary">Sign</button>
            <p class="form-message" data-form-message></p>
          </div>
        </form>

        <div class="flex min-w-0 flex-col">
          <p class="meta" data-entry-count></p>
          <div data-entry-list></div>
          <button type="button" class="button button-secondary button-small mt-6 self-start" data-load-more hidden>
            more
          </button>
        </div>
      </div>
    </div>
  `;

  return renderPage(context, { path: '/guestbook/', title: 'Guestbook', activeNav: 'guestbook' }, content);
}
