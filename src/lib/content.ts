// Reads everything in content/ into typed objects the templates can use.
// Every entry is a folder: content/<section>/<folder-name>/index.md plus its files.

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { readFrontmatter } from '../shared/frontmatter.ts';
import {
  IMAGE_EXTENSIONS,
  SLUG_PATTERN,
  VIDEO_EXTENSIONS,
  sections,
  slugify,
  type Field,
  type SectionKey,
} from '../shared/schema.ts';
import type { Media, MediaProcessor } from './images.ts';
import { renderMarkdown, type MediaResolver, type RenderedMarkdown } from './markdown.ts';
import { parseFountain, scriptToHtml, type Script } from './fountain.ts';

export interface Link {
  label: string;
  url: string;
}

export interface Page {
  body: RenderedMarkdown;
  image?: Media;
}

export interface Game {
  slug: string;
  title: string;
  status: string;
  year?: number;
  platforms: string[];
  engine?: string;
  role?: string;
  links: Link[];
  pinned: boolean;
  cover?: Media;
  hero?: Media;
  body: RenderedMarkdown;
}

export interface Chapter {
  slug: string;
  title: string;
  markdown: string;
  body: RenderedMarkdown;
}

export interface Story {
  slug: string;
  title: string;
  type: string;
  year?: number;
  pinned: boolean;
  cover?: Media;
  chapters: Chapter[];
  screenplay?: { script: Script; html: string };
  wordCount: number;
  excerpt: string;
  pdfUrl?: string;
}

export interface Post {
  section: 'blog' | 'devlogs';
  slug: string;
  title: string;
  date: string;
  tags: string[];
  project?: string;
  number?: number;
  excerpt: string;
  image?: Media;
  body: RenderedMarkdown;
  readingMinutes: number;
}

export interface SiteContent {
  home: Page;
  about: Page;
  games: Game[];
  stories: Story[];
  blog: Post[];
  devlogs: Post[];
}

interface Entry {
  section: SectionKey;
  slug: string;
  folder: string;
  files: string[];
  data: Record<string, unknown>;
  body: string;
  indexFile: string;
}

export interface LoadOptions {
  contentDir: string;
  media: MediaProcessor;
  includeDrafts: boolean;
}

// Collected while loading so you see every problem at once instead of one per build.
const problems: string[] = [];

function describe(entry: Entry): string {
  return path.relative(process.cwd(), entry.indexFile);
}

function readFields(entry: Entry, fields: Field[]): Record<string, any> {
  const values: Record<string, any> = {};

  for (const field of fields) {
    const raw = entry.data[field.key];

    if (raw === undefined || raw === null || raw === '') {
      if (field.required) problems.push(`${describe(entry)}: "${field.key}" is missing`);
      if (field.type === 'list' || field.type === 'links') values[field.key] = [];
      if (field.type === 'checkbox') values[field.key] = false;
      continue;
    }

    switch (field.type) {
      case 'text':
      case 'longtext':
        values[field.key] = String(raw).trim();
        break;

      case 'number':
        values[field.key] = Number(raw);
        if (Number.isNaN(values[field.key])) problems.push(`${describe(entry)}: "${field.key}" should be a number`);
        break;

      case 'checkbox':
        values[field.key] = raw === true || raw === 'true';
        break;

      case 'date': {
        const date = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).trim();
        if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
          problems.push(`${describe(entry)}: "${field.key}" should look like 2026-09-27`);
        }
        values[field.key] = date;
        break;
      }

      case 'choice': {
        const choice = String(raw).trim().toLowerCase();
        if (field.choices && !field.choices.includes(choice)) {
          problems.push(`${describe(entry)}: "${field.key}" should be one of: ${field.choices.join(', ')}`);
        }
        values[field.key] = choice;
        break;
      }

      case 'list': {
        const items = Array.isArray(raw) ? raw : String(raw).split(',');
        values[field.key] = items.map((item) => String(item).trim()).filter(Boolean);
        break;
      }

      case 'links':
        values[field.key] = readLinks(raw);
        break;
    }
  }

  return values;
}

// Links can be written as YAML objects ({ label, url }) or as "Label | https://…" lines.
function readLinks(raw: unknown): Link[] {
  const items = Array.isArray(raw) ? raw : String(raw).split('\n');
  const links: Link[] = [];

  for (const item of items) {
    if (item && typeof item === 'object' && 'url' in item) {
      const { label, url } = item as { label?: string; url: string };
      links.push({ label: String(label ?? url), url: String(url) });
    } else if (typeof item === 'string' && item.trim()) {
      const [label = '', url = ''] = item.split('|').map((part) => part.trim());
      links.push({ label: label || url, url: url || label });
    }
  }

  return links;
}

async function subfolders(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
}

async function readEntry(contentDir: string, section: SectionKey, slug?: string): Promise<Entry | null> {
  const folder = slug ? path.join(contentDir, section, slug) : path.join(contentDir, section);
  if (!existsSync(folder)) return null;

  const files = (await readdir(folder, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  const indexFile = path.join(folder, 'index.md');
  const text = existsSync(indexFile) ? await readFile(indexFile, 'utf8') : '';
  const { data, body } = readFrontmatter(text);

  return { section, slug: slug ?? section, folder, files, data, body, indexFile };
}

function isMediaFile(name: string): boolean {
  const extension = path.extname(name).toLowerCase();
  return IMAGE_EXTENSIONS.includes(extension) || VIDEO_EXTENSIONS.includes(extension);
}

// "cover.png", "cover.pixel.png" and "Cover.JPG" all count as the cover.
function findFile(entry: Entry, baseName: string): string | undefined {
  return entry.files.find((file) => {
    const name = file
      .replace(/\.[^.]+$/, '')
      .replace(/\.pixel$/, '')
      .toLowerCase();
    return isMediaFile(file) && name === baseName;
  });
}

function mediaHelpers(entry: Entry, media: MediaProcessor) {
  const urlFolder = entry.section === entry.slug ? `media/${entry.section}` : `media/${entry.section}/${entry.slug}`;

  const namedFile = async (baseName: string): Promise<Media | undefined> => {
    const file = findFile(entry, baseName);
    return file ? media.process(path.join(entry.folder, file), urlFolder) : undefined;
  };

  const resolve: MediaResolver = async (href) => {
    const isLocal = !/^([a-z]+:)?\/\//i.test(href) && !href.startsWith('/') && !href.startsWith('data:');
    if (!isLocal) return null;

    const relativePath = decodeURIComponent(href.split(/[?#]/)[0]!).replace(/^\.\//, '');
    const fullPath = path.resolve(entry.folder, relativePath);
    const insideFolder = fullPath.startsWith(path.resolve(entry.folder));

    if (!insideFolder || !existsSync(fullPath)) {
      problems.push(`${describe(entry)}: can't find "${href}"`);
      return null;
    }
    return media.process(fullPath, urlFolder);
  };

  return { namedFile, resolve };
}

async function loadEntries(options: LoadOptions, section: SectionKey): Promise<Entry[]> {
  const entries: Entry[] = [];

  for (const slug of await subfolders(path.join(options.contentDir, section))) {
    if (!SLUG_PATTERN.test(slug)) {
      problems.push(`content/${section}/${slug}: folder names must be lowercase-with-dashes (try "${slugify(slug)}")`);
    }

    const entry = await readEntry(options.contentDir, section, slug);
    if (!entry) continue;

    if (!existsSync(entry.indexFile)) {
      problems.push(`content/${section}/${slug}: missing index.md`);
      continue;
    }

    const isDraft = entry.data.draft === true || entry.data.draft === 'true';
    if (isDraft && !options.includeDrafts) continue;

    entries.push(entry);
  }

  return entries;
}

async function loadPage(options: LoadOptions, section: 'home' | 'about', imageName: string): Promise<Page> {
  const entry = await readEntry(options.contentDir, section);
  if (!entry) {
    return { body: await renderMarkdown('', async () => null) };
  }

  const { namedFile, resolve } = mediaHelpers(entry, options.media);
  return { body: await renderMarkdown(entry.body, resolve), image: await namedFile(imageName) };
}

async function loadGames(options: LoadOptions): Promise<Game[]> {
  const games: Game[] = [];

  for (const entry of await loadEntries(options, 'games')) {
    const fields = readFields(entry, sections.games.fields);
    const { namedFile, resolve } = mediaHelpers(entry, options.media);

    games.push({
      slug: entry.slug,
      title: fields.title,
      status: fields.status,
      year: fields.year,
      platforms: fields.platforms,
      engine: fields.engine,
      role: fields.role,
      links: fields.links,
      pinned: fields.pinned,
      cover: await namedFile('cover'),
      hero: await namedFile('hero'),
      body: await renderMarkdown(entry.body, resolve),
    });
  }

  return games.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
}

async function loadStories(options: LoadOptions): Promise<Story[]> {
  const stories: Story[] = [];

  for (const entry of await loadEntries(options, 'stories')) {
    const fields = readFields(entry, sections.stories.fields);
    const { namedFile, resolve } = mediaHelpers(entry, options.media);
    const intro = await renderMarkdown(entry.body, resolve);

    const story: Story = {
      slug: entry.slug,
      title: fields.title,
      type: fields.type,
      year: fields.year,
      pinned: fields.pinned,
      cover: await namedFile('cover'),
      chapters: [],
      wordCount: 0,
      excerpt: intro.excerpt,
    };

    const fountainFile = entry.files.find((file) => file.toLowerCase().endsWith('.fountain'));
    const chapterFiles = entry.files.filter((file) => /^\d+[-_ ].*\.md$/i.test(file));

    if (fountainFile) {
      const source = await readFile(path.join(entry.folder, fountainFile), 'utf8');
      const script = parseFountain(source);
      story.screenplay = { script, html: scriptToHtml(script) };
      story.wordCount = source.split(/\s+/).filter(Boolean).length;
    } else if (chapterFiles.length > 0) {
      const usedSlugs = new Set<string>();

      for (const [index, file] of chapterFiles.entries()) {
        let text = readFrontmatter(await readFile(path.join(entry.folder, file), 'utf8')).body;

        // The chapter title is the "# Title" line at the top, or else the file name.
        const heading = /^\s*#\s+(.+)\s*\n/.exec(text);
        const title = heading
          ? heading[1]!.trim()
          : file
              .replace(/^\d+[-_ ]/, '')
              .replace(/\.md$/i, '')
              .replace(/[-_]/g, ' ');
        if (heading) text = text.slice(heading[0].length);

        let slug = slugify(title) || `chapter-${index + 1}`;
        while (usedSlugs.has(slug)) slug += `-${index + 1}`;
        usedSlugs.add(slug);

        const body = await renderMarkdown(text, resolve);
        story.chapters.push({ slug, title, markdown: text, body });
        story.wordCount += body.wordCount;
      }

      story.excerpt ||= story.chapters[0]?.body.excerpt ?? '';
    } else {
      story.chapters.push({ slug: '', title: story.title, markdown: entry.body, body: intro });
      story.wordCount = intro.wordCount;
    }

    stories.push(story);
  }

  return stories.sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title),
  );
}

async function loadPosts(options: LoadOptions, section: 'blog' | 'devlogs'): Promise<Post[]> {
  const posts: Post[] = [];

  for (const entry of await loadEntries(options, section)) {
    const fields = readFields(entry, sections[section].fields);
    const { namedFile, resolve } = mediaHelpers(entry, options.media);
    const body = await renderMarkdown(entry.body, resolve);

    // Blog posts only show an image if you add one; devlogs fall back to the first image in the post.
    const image =
      section === 'blog' ? await namedFile('image') : ((await namedFile('thumb')) ?? body.firstMedia ?? undefined);

    posts.push({
      section,
      slug: entry.slug,
      title: fields.title,
      date: fields.date,
      tags: fields.tags,
      project: fields.project || undefined,
      excerpt: fields.excerpt || body.excerpt,
      image,
      body,
      readingMinutes: Math.max(1, Math.round(body.wordCount / 230)),
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

// Devlogs get a running number per project: the oldest is #1.
function numberDevlogs(devlogs: Post[]): void {
  const counts = new Map<string, number>();
  for (const post of [...devlogs].reverse()) {
    if (!post.project) continue;
    const next = (counts.get(post.project) ?? 0) + 1;
    counts.set(post.project, next);
    post.number = next;
  }
}

export async function loadContent(options: LoadOptions): Promise<SiteContent> {
  problems.length = 0;

  const content: SiteContent = {
    home: await loadPage(options, 'home', 'portrait'),
    about: await loadPage(options, 'about', 'image'),
    games: await loadGames(options),
    stories: await loadStories(options),
    blog: await loadPosts(options, 'blog'),
    devlogs: await loadPosts(options, 'devlogs'),
  };
  numberDevlogs(content.devlogs);

  if (problems.length > 0) {
    throw new Error('Some content needs fixing:\n  - ' + problems.join('\n  - '));
  }
  return content;
}
