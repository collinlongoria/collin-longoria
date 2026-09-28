// The /admin page: pick a section, pick or create an entry, edit it, publish.
// Publishing sends every changed file to /api/content.php in one request, which becomes
// one commit on GitHub (or, in a local dry run, files written into content/).

import { Marked } from 'marked';
import { api, errorMessage } from '../api.ts';
import { element } from '../dom.ts';
import { readFrontmatter, writeFrontmatter } from '../../shared/frontmatter.ts';
import { sectionKeys, sections, slugify, SLUG_PATTERN, type SectionKey } from '../../shared/schema.ts';
import { fieldInput } from './fields.ts';
import { isMediaFile, isTextFile, shrinkIfHuge, toBase64, uniqueFileName } from './uploads.ts';

interface RemoteFile {
  name: string;
  size: number;
  text?: string;
}

interface Deploy {
  status: string;
  conclusion: string | null;
  url: string;
}

// An image or video in the entry's folder. New ones only exist in the browser until you publish.
interface MediaFile {
  name: string;
  url: string;
  blob?: Blob;
  isNew: boolean;
}

let view: HTMLElement;
let deployBadge: HTMLAnchorElement;
let unsavedChanges = false;

function entryQuery(section: SectionKey, slug: string): string {
  const params = new URLSearchParams({ section });
  if (!sections[section].singlePage) params.set('slug', slug);
  return params.toString();
}

function confirmDiscard(): boolean {
  return !unsavedChanges || confirm('You have unpublished changes. Throw them away?');
}

function showMessage(text: string, isError = false): HTMLElement {
  return element('p', { class: isError ? 'form-message is-error' : 'form-message' }, text);
}

export async function setUpAdmin(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-admin]')!;

  const tabs = element('div', { class: 'flex flex-wrap gap-2' });
  deployBadge = element('a', { class: 'meta rounded-full border border-line px-2.5 py-1', target: '_blank' });
  view = element('div', { class: 'flex flex-col gap-6' });

  root.append(
    element(
      'div',
      { class: 'flex flex-wrap items-center gap-3' },
      tabs,
      element('span', { class: 'flex-1' }),
      deployBadge,
    ),
    view,
  );

  window.addEventListener('beforeunload', (event) => {
    if (unsavedChanges) event.preventDefault();
  });

  const tabButtons = new Map<SectionKey, HTMLButtonElement>();
  for (const key of sectionKeys) {
    const button = element('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, sections[key].label);
    button.addEventListener('click', () => openSection(key));
    tabButtons.set(key, button);
    tabs.append(button);
  }

  function openSection(key: SectionKey) {
    if (!confirmDiscard()) return;
    unsavedChanges = false;
    sessionStorage.setItem('admin-section', key);
    for (const [otherKey, button] of tabButtons) button.setAttribute('aria-pressed', String(otherKey === key));

    if (sections[key].singlePage) openEditor(key, key, false);
    else showEntryList(key);
  }

  refreshDeployBadge();
  openSection((sessionStorage.getItem('admin-section') as SectionKey) ?? 'blog');
}

// "deploying…" while GitHub is building the site, then "live". Checks every 8 seconds while busy.
let deployTimer: number | undefined;

async function refreshDeployBadge(keepChecking = false): Promise<void> {
  clearTimeout(deployTimer);

  try {
    const { dryRun, deploys } = await api<{ dryRun: boolean; deploys: Deploy[] }>('deploys.php');
    if (dryRun) {
      deployBadge.textContent = 'dry run: saves go to content/';
      return;
    }

    const latest = deploys[0];
    if (!latest) {
      deployBadge.textContent = 'no deploys yet';
      return;
    }

    const running = latest.status !== 'completed';
    if (running) deployBadge.textContent = 'deploying…';
    else if (latest.conclusion === 'success') deployBadge.textContent = 'live';
    else deployBadge.textContent = `deploy ${latest.conclusion}`;

    deployBadge.href = latest.url;
    deployBadge.classList.toggle('text-accent-fg', !running && latest.conclusion !== 'success');

    // Right after publishing, GitHub may not have started the run yet, so keep checking for a bit.
    if (running || keepChecking) deployTimer = window.setTimeout(() => refreshDeployBadge(), 8000);
  } catch {
    deployBadge.textContent = 'deploy status unavailable';
  }
}

async function showEntryList(section: SectionKey): Promise<void> {
  view.replaceChildren(showMessage('loading…'));

  let entries: { slug: string; files: number }[];
  try {
    entries = (await api<{ entries: typeof entries }>(`content.php?section=${section}`)).entries;
  } catch (error) {
    view.replaceChildren(showMessage(errorMessage(error), true));
    return;
  }

  const singular = sections[section].label.toLowerCase().replace(/s$/, '');
  const newButton = element(
    'button',
    { type: 'button', class: 'button button-primary button-small self-start' },
    `new ${singular}`,
  );
  newButton.addEventListener('click', () =>
    openEditor(
      section,
      '',
      true,
      entries.map((entry) => entry.slug),
    ),
  );

  const rows = entries
    .sort((a, b) => b.slug.localeCompare(a.slug))
    .map((entry) => {
      const row = element(
        'button',
        { type: 'button', class: 'divider-below flex items-center gap-4 py-3 text-left hover:text-accent-fg' },
        element('span', { class: 'flex-1 truncate text-[15px] font-medium' }, entry.slug),
        element('span', { class: 'meta' }, entry.files === 1 ? '1 file' : `${entry.files} files`),
      );
      row.addEventListener('click', () => openEditor(section, entry.slug, false));
      return row;
    });

  view.replaceChildren(
    newButton,
    element('div', { class: 'flex flex-col' }, ...(rows.length ? rows : [showMessage('empty')])),
  );
}

async function openEditor(section: SectionKey, slug: string, isNew: boolean, takenSlugs: string[] = []): Promise<void> {
  const config = sections[section];
  view.replaceChildren(showMessage('loading…'));

  // Everything being edited. Nothing is sent to the server until you press Publish.
  let fields: Record<string, unknown> = {};
  const textFiles = new Map<string, string>(); // for index.md this is the text below the "---" block
  const mediaFiles = new Map<string, MediaFile>();
  const removedFiles = new Set<string>();
  let currentTextFile = 'index.md';

  if (isNew) {
    textFiles.set('index.md', '');
    if (config.fields.some((field) => field.key === 'date')) {
      fields.date = new Date().toLocaleDateString('en-CA'); // en-CA formats as YYYY-MM-DD
    }
  } else {
    try {
      const { files } = await api<{ files: RemoteFile[] }>(`content.php?${entryQuery(section, slug)}`);
      for (const file of files) {
        if (file.name === 'index.md') {
          const parsed = readFrontmatter(file.text ?? '');
          fields = parsed.data;
          textFiles.set('index.md', parsed.body);
        } else if (isTextFile(file.name)) {
          textFiles.set(file.name, file.text ?? '');
        } else if (isMediaFile(file.name)) {
          const url = `/api/content-file.php?${entryQuery(section, slug)}&name=${encodeURIComponent(file.name)}`;
          mediaFiles.set(file.name, { name: file.name, url, isNew: false });
        }
      }
      if (!textFiles.has('index.md')) textFiles.set('index.md', '');
    } catch (error) {
      view.replaceChildren(showMessage(errorMessage(error), true));
      return;
    }
  }

  unsavedChanges = false;
  const markChanged = () => {
    unsavedChanges = true;
  };
  const allFileNames = () => new Set([...textFiles.keys(), ...mediaFiles.keys()]);

  const header = element('div', { class: 'flex flex-wrap items-center gap-3' });
  let slugInput: HTMLInputElement | undefined;
  let slugTouched = false;

  if (!config.singlePage) {
    const back = element('button', { type: 'button', class: 'meta text-fg-2 hover:text-fg' }, `← ${config.label}`);
    back.addEventListener('click', () => confirmDiscard() && showEntryList(section));
    header.append(back);

    if (isNew) {
      slugInput = element('input', {
        class: 'input max-w-xs font-mono text-sm',
        placeholder: 'folder-name',
        'aria-label': 'Folder name',
      });
      slugInput.addEventListener('input', () => {
        slugTouched = true;
        markChanged();
      });
      header.append(slugInput);
    } else {
      header.append(element('span', { class: 'meta text-fg-2' }, slug));
    }
  }

  // Fields. Typing a title fills in the folder name until you edit that yourself.

  const fieldGrid = element('div', { class: 'grid gap-4 sm:grid-cols-2' });
  for (const field of config.fields) {
    fieldGrid.append(
      fieldInput(field, fields, () => {
        markChanged();
        if (field.key === 'title' && slugInput && !slugTouched) slugInput.value = slugify(String(fields.title ?? ''));
      }),
    );
  }

  // Text editor with a tab per text file (stories can have chapters and screenplays).

  const textTabs = element('div', { class: 'flex flex-wrap items-center gap-2' });
  const textarea = element('textarea', { class: 'input min-h-[420px] font-mono text-[13.5px] leading-relaxed' });
  const preview = element('div', { class: 'prose panel min-h-[420px] p-5', hidden: true });
  const previewButton = element('button', { type: 'button', class: 'meta ml-auto hover:text-fg' }, 'preview');

  textarea.value = textFiles.get(currentTextFile) ?? '';
  textarea.addEventListener('input', () => {
    textFiles.set(currentTextFile, textarea.value);
    markChanged();
  });

  // Same markdown library as the build, so the preview matches the real page.
  // Images point at the local copy (new uploads) or the server copy (existing files).
  const markdown = new Marked({ gfm: true });
  markdown.use({
    renderer: {
      image({ href, text }) {
        const src = mediaFiles.get(href)?.url ?? href;
        const escape = (value: string) => value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
        if (/\.(mp4|webm)$/i.test(href)) return `<video src="${escape(src)}" controls muted></video>`;
        return `<img src="${escape(src)}" alt="${escape(text)}">`;
      },
    },
  });

  let previewing = false;

  function renderPreview() {
    if (currentTextFile.endsWith('.fountain')) {
      preview.replaceChildren(element('pre', { class: 'meta whitespace-pre-wrap text-fg' }, textarea.value));
    } else {
      // innerHTML is fine here: it's your own text, shown only to you.
      preview.innerHTML = markdown.parse(textarea.value) as string;
    }
  }

  previewButton.addEventListener('click', () => {
    previewing = !previewing;
    previewButton.textContent = previewing ? 'write' : 'preview';
    textarea.hidden = previewing;
    preview.hidden = !previewing;
    if (previewing) renderPreview();
  });

  function drawTextTabs() {
    textTabs.replaceChildren();

    for (const name of textFiles.keys()) {
      const tab = element(
        'button',
        { type: 'button', class: 'chip', 'aria-pressed': String(name === currentTextFile) },
        name,
      );
      tab.addEventListener('click', () => {
        currentTextFile = name;
        textarea.value = textFiles.get(name) ?? '';
        if (previewing) renderPreview();
        drawTextTabs();
      });
      textTabs.append(tab);
    }

    if (section === 'stories') {
      const addButton = element('button', { type: 'button', class: 'meta hover:text-fg' }, '+ file');
      addButton.addEventListener('click', () => {
        const typed = prompt('File name, e.g. 02-the-road.md for a chapter or script.fountain for a screenplay');
        if (!typed) return;
        const name = uniqueFileName(typed, allFileNames());
        if (!isTextFile(name)) {
          alert('Text files need to end in .md or .fountain');
          return;
        }
        textFiles.set(name, '');
        currentTextFile = name;
        textarea.value = '';
        markChanged();
        drawTextTabs();
      });
      textTabs.append(addButton);
    }

    if (currentTextFile !== 'index.md') {
      const removeButton = element(
        'button',
        { type: 'button', class: 'meta text-accent-fg hover:text-fg' },
        `remove ${currentTextFile}`,
      );
      removeButton.addEventListener('click', () => {
        if (!confirm(`Remove ${currentTextFile}?`)) return;
        textFiles.delete(currentTextFile);
        removedFiles.add(currentTextFile);
        currentTextFile = 'index.md';
        textarea.value = textFiles.get('index.md') ?? '';
        markChanged();
        drawTextTabs();
      });
      textTabs.append(removeButton);
    }

    textTabs.append(previewButton);
  }
  drawTextTabs();

  function insertIntoText(snippet: string) {
    if (previewing) previewButton.click();

    const before = textarea.value.slice(0, textarea.selectionStart);
    const after = textarea.value.slice(textarea.selectionEnd);
    // Images go on their own line, with a blank line before them.
    const gap = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';

    textarea.value = `${before}${gap}${snippet}\n${after}`;
    const cursor = (before + gap + snippet + '\n').length;
    textarea.setSelectionRange(cursor, cursor);
    textarea.focus();
    textFiles.set(currentTextFile, textarea.value);
    markChanged();
  }

  // Images: drop them on the box, pick them, or paste/drop them straight into the text.

  const fileList = element('div', { class: 'flex flex-col gap-2' });
  const filePicker = element('input', {
    type: 'file',
    multiple: true,
    accept: 'image/*,video/mp4,video/webm',
    hidden: true,
  });
  const dropZone = element(
    'button',
    {
      type: 'button',
      class: 'meta grid place-items-center rounded-md border border-dashed border-line-strong p-5 hover:text-fg-2',
    },
    'drop, paste or click to add images',
  );

  async function addFiles(files: Iterable<File>, insertIntoPost: boolean) {
    for (const original of files) {
      if (!original.type.startsWith('image/') && !original.type.startsWith('video/')) continue;

      const file = await shrinkIfHuge(original);
      // Pasted screenshots are all called "image.png", so give them a unique name.
      const suggested = file.name && file.name !== 'image.png' ? file.name : `image-${Date.now()}.png`;
      const name = uniqueFileName(suggested, allFileNames());

      mediaFiles.set(name, { name, url: URL.createObjectURL(file), blob: file, isNew: true });
      removedFiles.delete(name);
      if (insertIntoPost) insertIntoText(`![](${name})`);
    }
    markChanged();
    drawFileList();
  }

  dropZone.addEventListener('click', () => filePicker.click());
  filePicker.addEventListener('change', () => addFiles(filePicker.files ?? [], false));

  for (const target of [dropZone, textarea] as HTMLElement[]) {
    target.addEventListener('dragover', (event) => event.preventDefault());
    target.addEventListener('drop', (event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files?.length) return;
      event.preventDefault();
      addFiles(files, target === textarea);
    });
  }

  textarea.addEventListener('paste', (event) => {
    const files = event.clipboardData?.files;
    if (!files?.length) return;
    event.preventDefault();
    addFiles(files, true);
  });

  // Renaming is how you pick a cover: rename a file to cover.png. Links in the text follow along.
  async function renameFile(file: MediaFile, newName: string) {
    const others = allFileNames();
    others.delete(file.name);
    const name = uniqueFileName(newName, others);
    if (name === file.name) return;

    // An existing file has to be downloaded so it can be re-uploaded under the new name.
    const blob = file.blob ?? (await (await fetch(file.url)).blob());
    mediaFiles.delete(file.name);
    if (!file.isNew) removedFiles.add(file.name);
    mediaFiles.set(name, { name, url: URL.createObjectURL(blob), blob, isNew: true });

    for (const [textName, text] of textFiles) {
      textFiles.set(textName, text.replaceAll(`](${file.name})`, `](${name})`));
    }
    textarea.value = textFiles.get(currentTextFile) ?? '';
    markChanged();
    drawFileList();
  }

  function drawFileList() {
    fileList.replaceChildren();
    const files = [...mediaFiles.values()].sort((a, b) => a.name.localeCompare(b.name));

    for (const file of files) {
      const thumbnail = /\.(mp4|webm)$/i.test(file.name)
        ? element('video', { src: file.url, muted: true, class: 'size-12 shrink-0 rounded bg-surface object-cover' })
        : element('img', { src: file.url, alt: '', class: 'size-12 shrink-0 rounded bg-surface object-cover' });

      const nameInput = element('input', {
        value: file.name,
        class: 'meta min-w-0 flex-1 bg-transparent text-fg outline-none focus:text-accent-fg',
        'aria-label': 'File name',
      });
      nameInput.addEventListener('change', () => renameFile(file, nameInput.value));

      const insertButton = element('button', { type: 'button', class: 'meta hover:text-fg' }, 'insert');
      insertButton.addEventListener('click', () => insertIntoText(`![](${file.name})`));

      const removeButton = element(
        'button',
        { type: 'button', class: 'meta hover:text-accent-fg', 'aria-label': 'Remove' },
        '×',
      );
      removeButton.addEventListener('click', () => {
        mediaFiles.delete(file.name);
        if (!file.isNew) removedFiles.add(file.name);
        markChanged();
        drawFileList();
      });

      fileList.append(
        element('div', { class: 'flex items-center gap-2.5' }, thumbnail, nameInput, insertButton, removeButton),
      );
    }
  }
  drawFileList();

  const status = showMessage('');
  const publishButton = element('button', { type: 'button', class: 'button button-primary' }, 'Publish');

  publishButton.addEventListener('click', async () => {
    const targetSlug = isNew && !config.singlePage ? (slugInput?.value.trim() ?? '') : slug;

    if (!config.singlePage) {
      if (!SLUG_PATTERN.test(targetSlug)) {
        status.textContent = 'The folder name can only have lowercase letters, numbers and dashes.';
        return;
      }
      if (isNew && takenSlugs.includes(targetSlug)) {
        status.textContent = 'There is already an entry with that folder name.';
        return;
      }
    }

    const missing = config.fields.find((field) => field.required && (fields[field.key] ?? '') === '');
    if (missing) {
      status.textContent = `${missing.label} is required.`;
      return;
    }

    publishButton.disabled = true;
    status.textContent = 'publishing…';

    try {
      const files: { name: string; text?: string; base64?: string }[] = [];
      for (const [name, text] of textFiles) {
        files.push({ name, text: name === 'index.md' ? writeFrontmatter(fields, text) : text });
      }
      for (const file of mediaFiles.values()) {
        if (file.isNew && file.blob) files.push({ name: file.name, base64: await toBase64(file.blob) });
      }

      const { commit } = await api<{ commit: string }>(`content.php?${entryQuery(section, targetSlug)}`, {
        method: 'PUT',
        body: {
          files,
          delete: [...removedFiles],
          message: config.singlePage ? `${section}: update` : `${section}: ${targetSlug}`,
        },
      });

      unsavedChanges = false;
      removedFiles.clear();
      for (const file of mediaFiles.values()) file.isNew = false;
      if (isNew) {
        isNew = false;
        slug = targetSlug;
      }

      status.textContent =
        commit === 'local'
          ? 'saved to content/ (the dev server rebuilds on its own)'
          : 'published, deploying (1–2 minutes)';
      refreshDeployBadge(true);
    } catch (error) {
      status.textContent = errorMessage(error);
    }

    publishButton.disabled = false;
  });

  const actions = element(
    'div',
    { class: 'flex flex-wrap items-center gap-3 border-t border-line pt-5' },
    publishButton,
    status,
  );

  if (!isNew && !config.singlePage) {
    const deleteButton = element('button', { type: 'button', class: 'button button-secondary ml-auto' }, 'Delete');
    let armed = false;

    deleteButton.addEventListener('click', async () => {
      if (!armed) {
        armed = true;
        deleteButton.textContent = 'Really delete?';
        setTimeout(() => {
          armed = false;
          deleteButton.textContent = 'Delete';
        }, 4000);
        return;
      }

      try {
        await api(`content.php?${entryQuery(section, slug)}`, { method: 'DELETE' });
        unsavedChanges = false;
        refreshDeployBadge(true);
        showEntryList(section);
      } catch (error) {
        status.textContent = errorMessage(error);
      }
    });

    actions.append(deleteButton);
  }

  view.replaceChildren(
    header,
    element(
      'div',
      { class: 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]' },
      element(
        'div',
        { class: 'flex min-w-0 flex-col gap-5' },
        config.fields.length > 0 && fieldGrid,
        textTabs,
        textarea,
        preview,
      ),
      element(
        'aside',
        { class: 'flex flex-col gap-4' },
        dropZone,
        filePicker,
        fileList,
        element('p', { class: 'meta leading-relaxed' }, config.fileNotes),
      ),
    ),
    actions,
  );
}
