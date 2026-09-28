# How this site works

This guide explains the whole project, assuming you're comfortable programming but new to web
backends and PHP. Read the first three sections once. The rest you can dip into when you need it.

1. [The big picture](#1-the-big-picture)
2. [Setting up your computer](#2-setting-up-your-computer)
3. [Running it locally (the dry run)](#3-running-it-locally-the-dry-run)
4. [A tour of the folders](#4-a-tour-of-the-folders)
5. [How pages are built](#5-how-pages-are-built)
6. [Styling with Tailwind](#6-styling-with-tailwind)
7. [Browser scripts](#7-browser-scripts)
8. [PHP, from zero](#8-php-from-zero)
9. [The database](#9-the-database)
10. [Logging in, and keeping it safe](#10-logging-in-and-keeping-it-safe)
11. [Writing content](#11-writing-content)
12. [Deploying](#12-deploying)
13. [Setting up the server (once)](#13-setting-up-the-server-once)
14. [When something breaks](#14-when-something-breaks)

---

## 1. The big picture

The site has two halves that never run at the same time or in the same place.

**The static half** is every normal page: home, games, blog posts, stories. These are plain `.html`
files, made ahead of time by a build script (`src/build.ts`) from the markdown in `content/`.
Once built, nothing runs to show them; Hostinger just sends the file. That's why they're fast.

**The dynamic half** is the few things that change without a rebuild: thoughts, the guestbook, the
status line, the contact form, logging in and the admin editor. Those are small PHP files in `api/`.
When the browser asks for `/api/thoughts.php`, Hostinger runs that file, it talks to a database,
and sends back JSON. Browser scripts (`src/scripts/`) put that JSON on the page.

```
                 your computer / GitHub                         Hostinger
  content/*.md ──┐
  src/templates ─┼─► npm run build ─► dist/*.html ── deploy ──► public_html/   (static pages)
  src/styles ────┘                    dist/api/*.php ─────────► public_html/api/  (PHP, runs per request)
                                                                     │
                                                                     ▼
                                                        data/site.sqlite  (thoughts, guestbook…)
```

If you've done game dev: the build is like cooking assets. `content/` is the source art,
`dist/` is the cooked output, and the PHP API is the only thing with runtime logic.

## 2. Setting up your computer

You need **Node.js** (runs the build) and **PHP** (runs the API locally). In PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS     # Node 24
winget install PHP.PHP.8.4           # PHP
winget install Typst.Typst           # optional: only needed to make story PDFs locally
```

Close and reopen the terminal so it picks them up, then check:

```powershell
node -v      # v24.x
php -v       # PHP 8.4.x
```

Then, in the project folder:

```powershell
npm install
```

`npm install` reads `package.json` and downloads the libraries listed there into `node_modules/`.
You only run it again when `package.json` changes.

## 3. Running it locally (the dry run)

```powershell
npm run dev:examples   # the site filled with placeholder posts, games and stories
npm run dev            # the site with your real content/
```

Open http://localhost:4321. Every time you save a file, the site rebuilds and the browser reloads.
Stop it with Ctrl+C.

The dev server also runs the PHP API, as a **dry run**:

- Log in with the password **`dev`** (the lock icon at the bottom of the sidebar).
- Thoughts you post are saved, but instead of going to X and Threads, the text that *would* have
  been posted is written to `data/dry-run.log`. Contact form emails go there too.
- Publishing in the admin writes files straight into your `content/` folder (or `examples/content/`
  with `dev:examples`) instead of committing to GitHub. The site rebuilds and you see the change.
- The database is `data/local.sqlite`. To start fresh, stop the server and delete the `data/` folder.

So you can try everything, including publishing, deleting guestbook entries and breaking things,
without touching the real site. `data/` is in `.gitignore` and never gets committed.

Where the dry run is decided: `api/includes/config.php`. With no `site-config.php` around and PHP
running as a local dev server, it uses `local_defaults()`.

## 4. A tour of the folders

| Path | What's in it |
|---|---|
| `content/` | Your posts, games, stories, and the home and about text. One folder per entry. |
| `examples/content/` | Placeholder content for `npm run dev:examples`. Safe to change or delete. |
| `public/` | Copied to the site as-is: fonts, and later your logo, nav icons and favicon. |
| `src/config.ts` | Site name, URL, the sidebar pages, the footer's social links. |
| `src/build.ts` | The build script. Start here to see how everything is put together. |
| `src/dev-server.ts` | `npm run dev`: rebuild on save, live reload, runs PHP. |
| `src/lib/` | Build helpers: reading content, markdown, images, PDFs, RSS. |
| `src/templates/` | The HTML. `layout.ts` is the frame around every page (sidebar etc.), `pages/` has one file per page. |
| `src/styles/` | CSS. `theme.css` has the colors and fonts. |
| `src/scripts/` | JavaScript for the browser (written in TypeScript). |
| `src/shared/` | Code used both by the build and in the browser. |
| `api/` | The PHP API. Each `.php` file in `api/` is one URL. Shared code is in `api/includes/`. |
| `.github/workflows/deploy.yml` | What GitHub does when you push: build, then upload to Hostinger. |
| `docs/` | This guide, the design notes and the Figma exports. |

Folders that are made for you and ignored by git: `node_modules/` (libraries), `dist/` (the built
site), `.cache/` (resized images and PDFs, so rebuilds are quick), `data/` (local database).

## 5. How pages are built

`src/build.ts` runs these steps in order. It's worth reading top to bottom once.

1. **Read content.** `src/lib/content.ts` walks `content/`, reads each `index.md`, checks the fields
   at the top against `src/shared/schema.ts`, and turns the markdown into HTML (`src/lib/markdown.ts`).
   Images mentioned in the text are resized to a few WebP sizes (`src/lib/images.ts`).
2. **CSS and scripts.** Tailwind builds one CSS file; esbuild bundles `src/scripts/` into JavaScript.
3. **PDFs.** Stories become PDFs with Typst (`src/lib/pdf.ts`). Skipped if Typst isn't installed.
4. **Pages.** Every template in `src/templates/pages/` returns an HTML string; `pages/index.ts` lists
   them all with their URLs. Each is written to `dist/<url>/index.html`.
5. **Everything else.** RSS feeds, sitemap, `public/`, the `api/` folder, and `.htaccess` (the web
   server's settings: HTTPS, security headers, caching).

### Templates

Templates are plain TypeScript functions that return HTML, using the `html` helper from
`src/lib/html.ts`:

```ts
html`<h1>${post.title}</h1>`
```

Anything inside `${}` is escaped, so a title like `<script>` shows up as text instead of running.
To insert HTML you trust (like rendered markdown), wrap it: `${rawHtml(post.body.html)}`.
`${condition && html`...`}` prints nothing when the condition is false, which is how optional
bits are written everywhere.

### Adding a page

Say you want `/uses/`:

1. Create `src/templates/pages/uses.ts`:

   ```ts
   import { html } from '../../lib/html.ts';
   import { renderPage, type BuildContext } from '../layout.ts';
   import { pageTitle } from '../ui.ts';

   export function usesPage(context: BuildContext): string {
     const content = html`
       <div class="flex flex-col gap-8">
         ${pageTitle('Uses')}
         <p>Keyboard, editor, etc.</p>
       </div>
     `;
     return renderPage(context, { path: '/uses/', title: 'Uses' }, content);
   }
   ```

2. Add it to the list in `src/templates/pages/index.ts`:
   `{ path: '/uses/', html: usesPage(context) },`
3. To put it in the sidebar, add it to `navigation` in `src/config.ts`.

## 6. Styling with Tailwind

Tailwind gives you small single-purpose classes and you combine them in the HTML:

```html
<div class="flex flex-col gap-4 rounded border border-line bg-raised p-5">
```

reads as: flex column, 16px gap (Tailwind's unit is 4px, so `gap-4` = 16px), rounded corners,
1px border in the `line` color, `raised` background, 20px padding.

- **Colors and fonts** are defined once in `src/styles/theme.css`. `--color-accent: #6e1a2b`
  becomes `bg-accent`, `text-accent`, `border-accent`. Change the hex there and it changes everywhere.
- **Responsive** prefixes apply from a screen width up: `sm:` 640px, `md:` 768px, `lg:` 1024px.
  `grid sm:grid-cols-2 lg:grid-cols-3` is one column on phones, two on tablets, three on desktops.
- **Hover and friends**: `hover:text-fg`, `focus:border-accent-fg`.
- **Exact values** in brackets when the scale doesn't have it: `text-[15px]`, `w-[248px]`.
- **Reusable pieces** (buttons, tags, inputs, the sidebar) are normal CSS classes in
  `src/styles/components.css` and `layout.css`, used like `class="button button-primary"`.
  If you find yourself repeating the same ten classes, make a class there.

The VS Code extension "Tailwind CSS IntelliSense" autocompletes class names and shows the CSS behind them.

## 7. Browser scripts

`src/scripts/main.ts` runs on every page. It sets up the sidebar, the filter buttons, the login
dialog and the status line, then loads page-specific scripts only if the page needs them (the
guestbook script only downloads on the guestbook page).

Scripts find their part of the page with `data-` attributes, which the templates add:

```html
<div data-entry-list></div>                   <!-- in the template -->
document.querySelector('[data-entry-list]')    // in the script
```

That way classes stay purely for looks and you can restyle without breaking scripts.

Talking to the API always goes through `api()` in `src/scripts/api.ts`:

```ts
const { thoughts } = await api<{ thoughts: Thought[] }>('thoughts.php?limit=20');
await api('guestbook.php', { body: { name, message } });            // POST
await api(`guestbook.php?id=${id}`, { method: 'DELETE' });
```

Text from the API is always put on the page with `textContent` (via the `element()` helper in
`dom.ts`), never `innerHTML`, so a guestbook message can't inject HTML or scripts.

## 8. PHP, from zero

### How PHP runs

PHP isn't a program that stays running like a game server. Each request starts fresh: the web
server sees `/api/thoughts.php`, runs that file from the top, sends whatever it outputs, and
everything is thrown away. Nothing is remembered between requests except what you store in
the database or the session.

### Reading an endpoint

Here's `api/status.php`, the simplest one:

```php
<?php

require __DIR__ . '/includes/bootstrap.php';   // load all the shared functions
allow_methods('GET');                          // anything but GET gets a 405 error

$latest = query("SELECT feeling, created_at FROM thoughts
                 WHERE feeling IS NOT NULL AND feeling != ''
                 ORDER BY id DESC LIMIT 1")->fetch();

send_json(['feeling' => $latest['feeling'] ?? null]);   // prints JSON and stops
```

The syntax you need:

| PHP | Meaning |
|---|---|
| `$name` | Every variable starts with `$`. No declarations. |
| `'text'` / `"Hi $name"` | Single quotes are literal; double quotes fill in variables. |
| `.` | String concatenation: `'a' . 'b'`. (`+` is only for numbers.) |
| `['a' => 1, 'b' => 2]` | An array. PHP arrays double as lists and dictionaries. |
| `$row['feeling']` | Reading an array key. |
| `$x ?? 'default'` | `$x` if it exists and isn't null, otherwise the default. |
| `require 'file.php'` | Runs another file, like `#include`. |
| `function name(string $a): int {}` | Functions, with optional types. |
| `__DIR__` | The folder the current file is in. |
| `$_GET['id']` | `?id=…` from the URL. |
| `$_SERVER['REQUEST_METHOD']` | GET, POST, PUT or DELETE. |
| `exit` | Stops the script. `send_json()` and `send_error()` call it, which is why nothing after them runs. |

The browser sends JSON in the request body; `request_body()` in `api/includes/http.php` turns it
into an array. `text_field()` reads one field, trims it and checks its length.

### The shared code in `api/includes/`

| File | What it does |
|---|---|
| `bootstrap.php` | Loads all the others. Every endpoint starts with it. |
| `config.php` | Reads `site-config.php` (or the local dry-run defaults). `config('github.token')`. |
| `database.php` | `query()` for SQL, `now()` for timestamps, settings storage. |
| `http.php` | JSON in and out, and `http_request()` for calling other websites' APIs. |
| `auth.php` | Login, logout, sessions, the CSRF check. |
| `rate-limit.php` | "Max 3 guestbook entries per 10 minutes per visitor." |
| `captcha.php` | Checks the Turnstile captcha with Cloudflare. |
| `thoughts.php`, `x.php`, `threads.php` | Posting thoughts and cross-posting. |
| `content.php` | The admin's reading and publishing (local files, or GitHub). |
| `mail.php` | The contact form email. |

### Adding an endpoint

A "like" counter for posts, as an example. Create `api/likes.php`:

```php
<?php
// GET ?post=my-post: the count.  POST {post}: add one.

require __DIR__ . '/includes/bootstrap.php';
$method = allow_methods('GET', 'POST');

if ($method === 'GET') {
    $count = query('SELECT COUNT(*) FROM likes WHERE post = ?', [$_GET['post'] ?? ''])->fetchColumn();
    send_json(['likes' => (int) $count]);
}

$body = request_body();
$post = text_field($body, 'post', 100, true);
rate_limit('like', 10, 60 * 60);
query('INSERT INTO likes (post, created_at) VALUES (?, ?)', [$post, now()]);
send_json(['liked' => true], 201);
```

It's live at `/api/likes.php` as soon as it exists (the dev server picks it up immediately). The
table needs adding too; see [changing the schema](#changing-the-schema).

### Checking your PHP

- `php -l api/likes.php` checks a file for syntax errors.
- Errors while the dev server runs show up in its terminal, prefixed `[php]`.
- On the server, http://collinlongoria.com/api/health.php shows whether PHP, SQLite and the
  database are working. Errors go to hPanel → Advanced → Error logs.

## 9. The database

The database is **SQLite**: the whole thing is a single file (`data/local.sqlite` locally,
`data/site.sqlite` on the server). There's no database server to set up. The tables are in
`api/schema.sql` and are created automatically the first time the API runs.

| Table | Holds |
|---|---|
| `thoughts` | Each thought, its feeling, and whether it made it to X and Threads. |
| `guestbook` | Entries. Deleting one sets `deleted_at` rather than erasing it. |
| `settings` | Small values, like the current Threads token. |
| `rate_limits` | Recent actions per visitor, cleaned up daily by cron. |

To look inside, install [DB Browser for SQLite](https://sqlitebrowser.org)
(`winget install DBBrowserForSQLite.DBBrowserForSQLite`) and open the `.sqlite` file.

**SQL safety:** always pass values separately from the SQL:

```php
query('SELECT * FROM guestbook WHERE id = ?', [$id]);    // right
query("SELECT * FROM guestbook WHERE id = $id");         // never: this is how SQL injection happens
```

### Changing the schema

A brand new database gets everything in `schema.sql`. But the live database already exists, so
it needs an upgrade step too. SQLite keeps a version number inside the file for this, and
`api/includes/database.php` checks it every time it connects. To add a `likes` table:

1. Add the `CREATE TABLE likes (...)` to `api/schema.sql`.
2. In `database.php`, change `SCHEMA_VERSION` from 1 to 2.
3. In `upgrade_database()` in the same file, add the step for existing databases:

   ```php
   if ($from < 2) {
       $pdo->exec('CREATE TABLE likes (post TEXT NOT NULL, created_at TEXT NOT NULL)');
   }
   ```

The next request on the server runs the upgrade once, and the version is saved so it never runs again.

### Backups

Download `data/site.sqlite` from File Manager now and then. Hostinger also keeps its own backups
(hPanel → Files → Backups). Content doesn't need backing up: it lives in git.

## 10. Logging in, and keeping it safe

**Logging in.** The lock icon in the sidebar opens a password box. `api/login.php` checks the
password against the hash in `site-config.php` and starts a *session*: PHP stores
`logged_in = true` in a small file on the server and gives your browser a random ID for it in a
cookie. Every later request sends the cookie, so the server knows it's you. The cookie is
`HttpOnly` (JavaScript can't read it) and `Secure` (only sent over HTTPS).

**The admin buttons.** Pages are plain HTML, the same for everyone, so they can't know you're
logged in. Login also sets a readable `signed_in=1` cookie; a tiny script in each page's `<head>`
sees it and adds the `logged-in` class to `<html>`, which un-hides everything marked `admin-only`.
The server never trusts that cookie, so faking it gets someone buttons that don't work.

**CSRF.** If you're logged in and visit an evil site, it could make your browser send a request
to your API, and your cookie would go along. So every request that changes something must also
include a secret token (`X-CSRF-Token`) that the page got at login. The evil site can't read it,
so its forged requests fail. `require_login()` checks this.

**Everything else the code does for you:**

- Passwords are stored only as a slow hash (`npm run hash-password`).
- 5 login attempts per 15 minutes per visitor.
- Guestbook and contact: captcha, a hidden trap field that bots fill in, rate limits, length
  limits, max two links.
- All SQL uses `?` placeholders. All visitor text is shown with `textContent`.
- `site-config.php` and the database live outside `public_html`, so they can't be downloaded.
- `.htaccess` sends security headers, including a Content-Security-Policy that stops injected
  scripts from running.

## 11. Writing content

Normally: log in, open **admin** (bottom of the sidebar), pick a section, write, drag or paste
images into the text, **Publish**. Live, that's a commit to GitHub and the site updates in 1–2
minutes (the badge at the top right shows the deploy). In the dry run it writes to `content/`.

Or edit files directly. Each entry is a folder:

```
content/
  home/index.md              intro text.  portrait.png = the picture next to it
  about/index.md             about page.  image.png = optional picture on top
  games/<name>/index.md      cover.png (460×215), hero.png (wide banner), screenshots
  stories/<name>/index.md    cover.png (2:3)
      short story  → the text goes in index.md
      book         → 01-chapter-name.md, 02-…, each starting with "# Chapter title"
      screenplay   → script.fountain
  blog/<name>/index.md       image.png = optional header image
  devlogs/<name>/index.md    thumb.png = list thumbnail (else the first image in the post)
```

The top of `index.md` holds the fields between `---` lines:

```markdown
---
title: Shadow maps, finally
date: 2026-08-18
project: iron-lantern
tags: [graphics]
---

The post, in markdown. Images are just ![](shot.png) with the file in the same folder.
```

- The folder name is the URL: `content/blog/my-post` → `/blog/my-post/`. Lowercase and dashes.
- Which fields each section has, and which are required, is in `src/shared/schema.ts`. The build
  lists everything that's wrong at once.
- `draft: true` hides an entry (drafts still show in `npm run dev`).
- Screenshots and photos are resized automatically. GIFs, videos (`.mp4`, `.webm`) and SVGs are
  used as-is. **Pixel art:** put `.pixel.` in the name (`cover.pixel.png`) so it's never resized
  or smoothed.

Your own assets go in `public/`: `images/logo.png` (the sidebar logo), `images/icons/<page>.png`
for the nav icons (16×16; names: about games stories blog devlogs thoughts guestbook contact),
and `favicon.ico`.

## 12. Deploying

Pushing to `main` on GitHub runs `.github/workflows/deploy.yml`:

1. Check out the code and install Node, Typst and the npm libraries.
2. `npm run check` (TypeScript type check) and `npm run build`.
3. Upload `dist/` to `public_html` over FTP. Only changed files are uploaded, and files you
   removed are deleted on the server.

It takes 1–2 minutes. Watch it under the repo's **Actions** tab; a red X there means the build or
upload failed, and clicking it shows the log.

On Hostinger, it ends up like this:

```
/home/u123456789/domains/collinlongoria.com/
├── site-config.php        ← you upload this once. Never touched by deploys.
├── data/
│   ├── site.sqlite        ← the database, created automatically
│   └── sessions/
└── public_html/           ← dist/ goes here on every deploy
    ├── index.html, blog/, games/ …
    └── api/*.php
```

## 13. Setting up the server (once)

Do these in order. `/api/health.php` is handy along the way.

1. **PHP.** hPanel → Advanced → PHP Configuration: pick PHP 8.3 or newer, and under PHP extensions
   make sure `pdo_sqlite`, `curl`, `mbstring` and `intl` are ticked.
2. **Config file.** Copy `api/config.example.php` to a new file called `site-config.php` on your
   computer. Fill in:
   - `admin_password_hash`: run `npm run hash-password` and paste the line it prints.
   - `secret`: any long random string.

   Leave the rest empty for now. Upload it with hPanel → File Manager into
   `domains/collinlongoria.com/` (the folder that *contains* `public_html`).
3. **First deploy.** Push to GitHub. When the Actions run is green, open the site, then
   `/api/health.php`: everything should say `true` and `dryRun` should be `false`.
4. **Log in** with the lock icon. Post a thought with both X and Threads unticked to test.
5. **Cron.** hPanel → Advanced → Cron Jobs → every 10 minutes, command:
   `php /home/<your username>/domains/collinlongoria.com/public_html/api/cron.php`
6. **Admin publishing.** GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained → only the collin-longoria repo, permissions *Contents: Read and write* and
   *Actions: Read-only*. Put it in `github.token`.
7. **Contact form.** `mail.to` = your inbox. `mail.from` = an address on your domain; create it
   under hPanel → Emails if messages don't arrive.
8. **Captcha.** Cloudflare dashboard → Turnstile → Add widget for `collinlongoria.com` (free; your
   domain doesn't need to be on Cloudflare). Site key → `turnstileSiteKey` in `src/config.ts`,
   secret key → `turnstile_secret` in `site-config.php`.
9. **X.** At developer.x.com create an app, set its permissions to *Read and write*, then generate
   the access token and secret (after changing permissions, or they'll be read-only). Four values
   go under `x`. Posting costs a little per post, so add some credit.
10. **Threads.** At developers.facebook.com create an app with the *Access the Threads API* use case,
    add the `threads_basic` and `threads_content_publish` permissions, add your Threads account as a
    tester and accept the invite in the Threads app (Settings → Account → Website permissions).
    Generate a token with the User Token Generator, exchange it for a long-lived one, and put it in
    `threads.access_token`. Cron keeps it fresh from then on.
11. **Your links.** Fill in the X and Threads URLs in `socialLinks` in `src/config.ts`. Each link with
    a URL shows up as an icon in the footer. More icons (Steam, Bluesky, YouTube) are ready in
    `src/templates/social-icons.ts`.

Whenever you change `site-config.php`, re-upload it; no deploy is needed.

## 14. When something breaks

**The build fails.** The message lists the problem, e.g. `content/blog/x/index.md: "date" is
missing`. Content problems are all listed together.

**A page looks wrong but built fine.** Open the browser's developer tools (F12). The Console tab
shows script errors; the Network tab shows each `/api/…` request and what it answered.

**An API call fails.** Its JSON answer has an `error` message. Locally, look at the dev server
terminal for `[php]` lines. On the server: hPanel → Advanced → Error logs.

**A thought didn't reach X or Threads.** It's still saved. You'll see a "retry" link under it
(only when logged in), and cron retries on its own for three days. The reason it failed is stored in the `x_error` /
`threads_error` columns (open the database to read it).

**"You need to log in" in the admin.** Your session expired (30 days) or you logged out elsewhere.
Log in again.

**Locally, PHP features don't work.** Check `php -v` works in a new terminal. The dev server says
so when it can't find PHP.

**Start over locally.** Stop the dev server, delete `data/`, `dist/` and `.cache/`, run it again.
