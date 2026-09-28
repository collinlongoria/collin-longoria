import { api, errorMessage } from './api.ts';
import { addCaptcha } from './captcha.ts';
import { element, formatDate, formValues, showFormMessage } from './dom.ts';

interface Entry {
  id: number;
  name: string;
  location: string | null;
  message: string;
  createdAt: string;
}

function renderEntry(entry: Entry, loggedIn: boolean): HTMLElement {
  const header = element(
    'div',
    { class: 'flex items-center gap-2' },
    element('span', { class: 'text-sm font-medium' }, entry.name),
    element('span', { class: 'min-w-0 flex-1 truncate text-[13px] text-fg-3' }, entry.location ?? ''),
    element('time', { class: 'meta text-[11px]', datetime: entry.createdAt }, formatDate(entry.createdAt)),
  );

  const article = element(
    'article',
    { class: 'divider-below flex flex-col gap-2.5 py-5' },
    header,
    element('p', { class: 'text-[15px] leading-relaxed whitespace-pre-wrap break-words text-fg-2' }, entry.message),
  );

  if (loggedIn) {
    // Click once to arm, again within 3 seconds to delete.
    const deleteButton = element(
      'button',
      { type: 'button', class: 'tag hover:text-fg', 'aria-label': 'Delete entry' },
      '×',
    );
    let armed = false;

    deleteButton.addEventListener('click', async () => {
      if (!armed) {
        armed = true;
        deleteButton.textContent = 'delete?';
        setTimeout(() => {
          armed = false;
          deleteButton.textContent = '×';
        }, 3000);
        return;
      }

      try {
        await api(`guestbook.php?id=${entry.id}`, { method: 'DELETE' });
        article.remove();
      } catch (error) {
        deleteButton.textContent = errorMessage(error);
      }
    });

    header.append(deleteButton);
  }

  return article;
}

export async function setUpGuestbook(loggedIn: boolean): Promise<void> {
  const list = document.querySelector<HTMLElement>('[data-entry-list]')!;
  const count = document.querySelector('[data-entry-count]');
  const moreButton = document.querySelector<HTMLButtonElement>('[data-load-more]');
  let oldestId = 0;
  let total = 0;

  function showCount() {
    if (count) count.textContent = total === 1 ? '1 entry' : `${total} entries`;
  }

  async function loadPage() {
    const params = new URLSearchParams({ limit: '20' });
    if (oldestId) params.set('before', String(oldestId));

    const result = await api<{ entries: Entry[]; hasMore: boolean; total: number }>(`guestbook.php?${params}`);
    for (const entry of result.entries) list.append(renderEntry(entry, loggedIn));
    if (result.entries.length > 0) oldestId = result.entries[result.entries.length - 1]!.id;

    total = result.total;
    showCount();
    if (moreButton) moreButton.hidden = !result.hasMore;
  }

  moreButton?.addEventListener('click', () => loadPage().catch(() => {}));
  loadPage().catch(() => {});

  const form = document.querySelector<HTMLFormElement>('[data-guestbook-form]');
  if (!form) return;
  const captcha = await addCaptcha(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    button.disabled = true;
    showFormMessage(form, '');

    try {
      const { entry } = await api<{ entry: Entry | null }>('guestbook.php', {
        body: { ...formValues(form), captcha: captcha.token() },
      });
      if (entry) {
        list.prepend(renderEntry(entry, loggedIn));
        total++;
        showCount();
      }
      form.reset();
      showFormMessage(form, 'signed');
    } catch (error) {
      showFormMessage(form, errorMessage(error), true);
    }

    captcha.reset();
    button.disabled = false;
  });
}
