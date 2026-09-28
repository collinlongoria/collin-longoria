import { html } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { formField, pageTitle } from '../ui.ts';

export function contactPage(context: BuildContext): string {
  const content = html`
    <div class="flex flex-col gap-10">
      ${pageTitle('Contact')}

      <form class="flex max-w-[560px] flex-col gap-4" data-contact-form>
        ${formField('name', 'name', { required: true, maxLength: 100, autocomplete: 'name' })}
        ${formField('email', 'email', { type: 'email', required: true, maxLength: 200, autocomplete: 'email' })}
        ${formField('message', 'message', { multiline: true, required: true, rows: 8, maxLength: 5000 })}
        <div data-turnstile></div>
        <input type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true" />

        <div class="flex items-center gap-3">
          <button type="submit" class="button button-primary">Send</button>
          <p class="form-message" data-form-message></p>
        </div>
      </form>
    </div>
  `;

  return renderPage(context, { path: '/contact/', title: 'Contact', activeNav: 'contact' }, content);
}
