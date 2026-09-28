// The fields each kind of content has. The build uses this to validate your files,
// and the admin editor uses it to draw its form, so a new field only needs adding here.

export type FieldType = 'text' | 'longtext' | 'date' | 'number' | 'checkbox' | 'list' | 'choice' | 'links';

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  choices?: readonly string[];
  hint?: string;
}

export type SectionKey = 'home' | 'about' | 'games' | 'stories' | 'blog' | 'devlogs';

export interface Section {
  key: SectionKey;
  label: string;
  // Single-page sections (home, about) have one index.md and no sub-folders.
  singlePage: boolean;
  fields: Field[];
  fileNotes: string;
}

export const GAME_STATUSES = ['released', 'in development', 'prototype', 'archived'];
export const STORY_TYPES = ['book', 'short story', 'screenplay'];

const draftField: Field = { key: 'draft', label: 'Draft (hidden from the site)', type: 'checkbox' };

export const sections: Record<SectionKey, Section> = {
  home: {
    key: 'home',
    label: 'Home',
    singlePage: true,
    fields: [],
    fileNotes: 'The text is the intro. portrait.png (or .jpg…) is the picture next to it.',
  },
  about: {
    key: 'about',
    label: 'About Me',
    singlePage: true,
    fields: [],
    fileNotes: 'image.png (or .jpg…) is shown above the text.',
  },
  games: {
    key: 'games',
    label: 'Games',
    singlePage: false,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'choice', choices: GAME_STATUSES, required: true },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'platforms', label: 'Platforms', type: 'list', hint: 'comma separated' },
      { key: 'engine', label: 'Engine', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      {
        key: 'links',
        label: 'Links',
        type: 'links',
        hint: 'one per line: Label | https://…  (the first one is the big button)',
      },
      { key: 'pinned', label: 'Pinned on the home page', type: 'checkbox' },
      draftField,
    ],
    fileNotes: 'cover.png is the 460×215 capsule. hero.png is the wide banner on the game page.',
  },
  stories: {
    key: 'stories',
    label: 'Stories',
    singlePage: false,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'choice', choices: STORY_TYPES, required: true },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'pinned', label: 'Pinned on the home page', type: 'checkbox' },
      draftField,
    ],
    fileNotes:
      'cover.png is the 2:3 cover. A short story goes in index.md. A book has one file per ' +
      'chapter (01-name.md, 02-name.md…) starting with "# Chapter title". A screenplay goes in script.fountain.',
  },
  blog: {
    key: 'blog',
    label: 'Blog',
    singlePage: false,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'tags', label: 'Tags', type: 'list', hint: 'comma separated' },
      { key: 'excerpt', label: 'Excerpt', type: 'longtext', hint: 'optional, defaults to the first paragraph' },
      draftField,
    ],
    fileNotes: 'image.png is an optional header image.',
  },
  devlogs: {
    key: 'devlogs',
    label: 'Devlogs',
    singlePage: false,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'project', label: 'Project', type: 'text', hint: 'the game folder name, e.g. my-game' },
      { key: 'tags', label: 'Tags', type: 'list', hint: 'comma separated' },
      { key: 'excerpt', label: 'Excerpt', type: 'longtext' },
      draftField,
    ],
    fileNotes: 'thumb.png is the list thumbnail. Without one, the first image in the post is used.',
  },
};

export const sectionKeys = Object.keys(sections) as SectionKey[];

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg'];
export const VIDEO_EXTENSIONS = ['.mp4', '.webm'];

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
