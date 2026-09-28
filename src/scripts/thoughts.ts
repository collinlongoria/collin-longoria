// The thoughts list (on /thoughts and the home page) and, when you're logged in, the composer.

import { api, errorMessage } from './api.ts';
import { element, formatDateTime, showFormMessage, textWithLinks } from './dom.ts';
import { forgetStatus, showStatus } from './status.ts';
import { crossPostText, feelingLine, MAX_THOUGHT_LENGTH, postLength } from '../shared/thought-text.ts';

type PostStatus = 'pending' | 'posted' | 'failed' | 'skipped';

interface Thought {
  id: number;
  body: string;
  feeling: string | null;
  createdAt: string;
  xUrl: string | null;
  threadsUrl: string | null;
  xStatus: PostStatus;
  threadsStatus: PostStatus;
}

function renderThought(thought: Thought, loggedIn: boolean): HTMLElement {
  const footer = element(
    'div',
    { class: 'meta flex flex-wrap items-center gap-3 text-[11px]' },
    element(
      'a',
      { href: `/thoughts/#thought-${thought.id}`, class: 'hover:text-fg' },
      formatDateTime(thought.createdAt),
    ),
    thought.xUrl &&
      element('a', { href: thought.xUrl, target: '_blank', rel: 'noopener', class: 'hover:text-fg' }, '↗ X'),
    thought.threadsUrl &&
      element(
        'a',
        { href: thought.threadsUrl, target: '_blank', rel: 'noopener', class: 'hover:text-fg' },
        '↗ Threads',
      ),
  );

  const article = element(
    'article',
    { class: 'divider-below flex flex-col gap-3 py-5', id: `thought-${thought.id}` },
    element(
      'p',
      { class: 'text-[15px] leading-relaxed whitespace-pre-wrap break-words' },
      ...textWithLinks(thought.body),
    ),
    thought.feeling && element('p', { class: 'text-[13px] text-fg-2' }, feelingLine(thought.feeling)),
    footer,
  );

  // Retry for cross-posts that didn't go through (only rendered for you).
  const unfinished = [
    (thought.xStatus === 'failed' || thought.xStatus === 'pending') && 'X',
    (thought.threadsStatus === 'failed' || thought.threadsStatus === 'pending') && 'Threads',
  ].filter(Boolean);

  if (loggedIn && unfinished.length > 0) {
    const retry = element(
      'button',
      { type: 'button', class: 'text-accent-fg hover:text-fg' },
      `retry ${unfinished.join(' + ')}`,
    );
    retry.addEventListener('click', async () => {
      retry.textContent = 'retrying…';
      try {
        const result = await api<{ thought: Thought }>(`retry-thought.php?id=${thought.id}`, { method: 'POST' });
        article.replaceWith(renderThought(result.thought, loggedIn));
      } catch (error) {
        retry.textContent = errorMessage(error);
      }
    });
    footer.append(retry);
  }

  return article;
}

async function setUpList(list: HTMLElement, loggedIn: boolean): Promise<void> {
  const limit = Number(list.dataset.limit ?? 20);
  const homeSection = list.closest<HTMLElement>('[data-home-thoughts]');
  const moreButton = homeSection ? null : document.querySelector<HTMLButtonElement>('[data-load-more]');
  let oldestId = 0;

  async function loadPage() {
    const params = new URLSearchParams({ limit: String(limit) });
    if (oldestId) params.set('before', String(oldestId));

    const { thoughts, hasMore } = await api<{ thoughts: Thought[]; hasMore: boolean }>(`thoughts.php?${params}`);
    for (const thought of thoughts) list.append(renderThought(thought, loggedIn));
    if (thoughts.length > 0) oldestId = thoughts[thoughts.length - 1]!.id;

    if (homeSection) homeSection.hidden = list.children.length === 0;
    if (moreButton) moreButton.hidden = !hasMore;
  }

  moreButton?.addEventListener('click', () => loadPage().catch(() => {}));
  await loadPage().catch(() => {});

  // Links like /thoughts/#thought-12 point at a thought that only exists after loading.
  if (location.hash.startsWith('#thought-')) {
    document.querySelector(location.hash)?.scrollIntoView();
  }
}

function setUpComposer(list: HTMLElement): void {
  const form = document.querySelector<HTMLFormElement>('[data-composer]');
  if (!form) return;

  const body = form.elements.namedItem('body') as HTMLTextAreaElement;
  const feeling = form.elements.namedItem('feeling') as HTMLInputElement;
  const counter = form.querySelector('[data-counter]')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type=submit]')!;

  // The counter measures what actually gets posted: the text plus the feeling line.
  function updateCounter() {
    const length = postLength(crossPostText(body.value, feeling.value));
    counter.textContent = `${length}/${MAX_THOUGHT_LENGTH}`;
    counter.classList.toggle('text-accent-fg', length > MAX_THOUGHT_LENGTH);
    submit.disabled = length > MAX_THOUGHT_LENGTH || body.value.trim() === '';
  }

  body.addEventListener('input', updateCounter);
  feeling.addEventListener('input', updateCounter);
  updateCounter();

  body.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') form.requestSubmit();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    showFormMessage(form, '');

    try {
      const { thought } = await api<{ thought: Thought }>('thoughts.php', {
        body: {
          body: body.value,
          feeling: feeling.value,
          postToX: (form.elements.namedItem('postToX') as HTMLInputElement).checked,
          postToThreads: (form.elements.namedItem('postToThreads') as HTMLInputElement).checked,
        },
      });

      list.prepend(renderThought(thought, true));
      form.reset();
      forgetStatus();
      if (thought.feeling) showStatus(thought.feeling);
    } catch (error) {
      showFormMessage(form, errorMessage(error), true);
    }

    updateCounter();
  });
}

export async function setUpThoughts(loggedIn: boolean): Promise<void> {
  for (const list of document.querySelectorAll<HTMLElement>('[data-thought-list]')) {
    await setUpList(list, loggedIn);
    if (loggedIn && !list.closest('[data-home-thoughts]')) setUpComposer(list);
  }
}
