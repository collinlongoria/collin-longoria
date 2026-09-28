import { html } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { pageTitle } from '../ui.ts';

// The list is loaded by src/scripts/thoughts.ts. The composer only appears when you're logged in.
export function thoughtsPage(context: BuildContext): string {
  const content = html`
    <div class="flex flex-col gap-10">
      ${pageTitle('Thoughts')}

      <div class="flex w-full max-w-[600px] flex-col">
        <form class="panel admin-only mb-4 flex flex-col gap-3.5 p-4" data-composer>
          <textarea
            name="body"
            rows="3"
            class="min-h-[88px] w-full resize-y bg-transparent text-base outline-none placeholder:text-fg-3"
            aria-label="Thought"
            required
          ></textarea>

          <div class="flex items-center gap-2 border-t border-line pt-3">
            <span class="meta shrink-0">Currently feeling</span>
            <input name="feeling" maxlength="80" class="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <label class="meta flex items-center gap-1.5 text-fg-2">
              <input type="checkbox" name="postToX" checked class="accent-accent" /> X
            </label>
            <label class="meta flex items-center gap-1.5 text-fg-2">
              <input type="checkbox" name="postToThreads" checked class="accent-accent" /> Threads
            </label>
            <span class="meta ml-auto" data-counter>0/280</span>
            <button type="submit" class="button button-primary button-small">Post</button>
          </div>

          <p class="form-message is-error" data-form-message></p>
        </form>

        <div data-thought-list data-limit="20"></div>
        <button type="button" class="button button-secondary button-small mt-6 self-start" data-load-more hidden>
          more
        </button>
      </div>
    </div>
  `;

  return renderPage(context, { path: '/thoughts/', title: 'Thoughts', activeNav: 'thoughts' }, content);
}
