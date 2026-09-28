// Builds the whole site into dist/. Run with `npm run build`.
//
//   1. read content/ (markdown + images)
//   2. build the CSS (Tailwind) and browser scripts (esbuild)
//   3. make story PDFs (Typst)
//   4. render every page to HTML
//   5. copy public/ and api/, and write the server config (.htaccess)

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { site } from './config.ts';
import { loadContent, type SiteContent } from './lib/content.ts';
import { MediaProcessor } from './lib/images.ts';
import { hasTypst, makePdf, proseToTypst } from './lib/pdf.ts';
import { scriptToTypst } from './lib/fountain.ts';
import { rssFeed, sitemap } from './lib/feeds.ts';
import { HEAD_SCRIPT, type BuildContext } from './templates/layout.ts';
import { allPages } from './templates/pages/index.ts';

export const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CACHE = path.join(ROOT, '.cache');

export interface BuildOptions {
  // Use examples/content instead of content/.
  examples?: boolean;
  includeDrafts?: boolean;
  // Skips minifying so errors in the browser are readable.
  dev?: boolean;
}

function shortHash(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex').slice(0, 10);
}

async function listFiles(dir: string, base = dir): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(fullPath, base)));
    else files.push(path.relative(base, fullPath).split(path.sep).join('/'));
  }
  return files;
}

async function buildCss(dev: boolean): Promise<string> {
  const binary = process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss';
  const output = path.join(CACHE, 'site.css');
  const args = ['-i', path.join(ROOT, 'src/styles/main.css'), '-o', output];
  if (!dev) args.push('--minify');

  const result = spawnSync(path.join(ROOT, 'node_modules/.bin', binary), args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32', // .cmd files need a shell on Windows
  });
  if (result.status !== 0) throw new Error(`Tailwind failed:\n${result.stderr}`);

  // The hash in the name means browsers re-download it only when it changes.
  const css = await readFile(output);
  const name = `site-${shortHash(css)}.css`;
  await writeFile(path.join(DIST, 'assets', name), css);
  return `/assets/${name}`;
}

async function buildScripts(dev: boolean): Promise<string> {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/scripts/main.ts')],
    bundle: true,
    format: 'esm',
    // Page-specific code (admin, guestbook…) goes into separate files that load only when needed.
    splitting: true,
    target: 'es2022',
    outdir: path.join(DIST, 'assets'),
    entryNames: '[name]-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    minify: !dev,
    sourcemap: dev,
    metafile: true,
    define: { TURNSTILE_SITE_KEY: JSON.stringify(site.turnstileSiteKey) },
    logLevel: 'warning',
  });

  const main = Object.entries(result.metafile.outputs).find(([, output]) =>
    output.entryPoint?.endsWith('src/scripts/main.ts'),
  );
  if (!main) throw new Error('esbuild did not produce main.js');
  return '/' + path.relative(DIST, path.resolve(ROOT, main[0])).split(path.sep).join('/');
}

// Bump this to force every PDF to be rebuilt (e.g. after changing the PDF layout).
const PDF_VERSION = '3';

async function buildPdfs(content: SiteContent): Promise<void> {
  if (content.stories.length === 0) return;
  if (!hasTypst()) {
    console.warn('typst is not installed, so story PDFs were skipped (the deploy always builds them)');
    return;
  }

  await mkdir(path.join(CACHE, 'pdf'), { recursive: true });

  for (const story of content.stories) {
    const source = story.screenplay
      ? scriptToTypst(story.screenplay.script, story.title, site.author)
      : proseToTypst(
          story.title,
          site.author,
          story.chapters.map((chapter) => ({ title: chapter.title, markdown: chapter.markdown })),
        );

    // PDFs are slow to make, so reuse the last one if the text hasn't changed.
    const cached = path.join(CACHE, 'pdf', `${shortHash(source + PDF_VERSION)}.pdf`);
    if (!existsSync(cached)) await makePdf(source, cached);

    const output = path.join(DIST, 'stories', story.slug, `${story.slug}.pdf`);
    await mkdir(path.dirname(output), { recursive: true });
    await copyFile(cached, output);
    story.pdfUrl = `/stories/${story.slug}/${story.slug}.pdf`;
  }
}

// Apache/LiteSpeed config for Hostinger: HTTPS, security headers and caching.
function htaccess(): string {
  // The Content-Security-Policy blocks inline scripts, except the one in <head>, allowed by its hash.
  const headScriptHash = createHash('sha256').update(HEAD_SCRIPT).digest('base64');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'sha256-${headScriptHash}' https://challenges.cloudflare.com`,
    'frame-src https://challenges.cloudflare.com',
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  return `# Generated by src/build.ts. Edit it there, not here.
Options -Indexes
DirectoryIndex index.html index.php
ErrorDocument 404 /404.html

RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]

<Files ".ftp-deploy-sync-state.json">
  Require all denied
</Files>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "DENY"
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set Content-Security-Policy "${csp}"
  <FilesMatch "\\.(html|xml)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.woff2$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
`;
}

// Files in /assets and /media have a hash in their name, so they never change and can be cached forever.
const CACHE_FOREVER = `<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
`;

export async function build(options: BuildOptions = {}): Promise<{ pageCount: number; seconds: number }> {
  const startedAt = Date.now();
  const dev = options.dev ?? false;

  await rm(DIST, { recursive: true, force: true });
  await mkdir(path.join(DIST, 'assets'), { recursive: true });
  await mkdir(CACHE, { recursive: true });

  const content = await loadContent({
    contentDir: path.join(ROOT, options.examples ? 'examples/content' : 'content'),
    media: new MediaProcessor(DIST, path.join(CACHE, 'media')),
    includeDrafts: options.includeDrafts ?? false,
  });

  const [cssUrl, jsUrl] = await Promise.all([buildCss(dev), buildScripts(dev)]);
  await buildPdfs(content);

  const publicFiles = new Set(await listFiles(path.join(ROOT, 'public')));
  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });

  const context: BuildContext = {
    content,
    cssUrl,
    jsUrl,
    hasPublicFile: (file) => publicFiles.has(file),
  };

  const pages = allPages(context);
  for (const page of pages) {
    const file = page.path.endsWith('/') ? path.join(DIST, page.path, 'index.html') : path.join(DIST, page.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, page.html);
  }

  await writeFile(path.join(DIST, 'blog/rss.xml'), rssFeed('Blog', '/blog/', content.blog));
  await writeFile(path.join(DIST, 'devlogs/rss.xml'), rssFeed('Devlogs', '/devlogs/', content.devlogs));
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap(pages.map((page) => page.path)));
  await writeFile(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${site.url}/sitemap.xml\n`,
  );

  await writeFile(path.join(DIST, '.htaccess'), htaccess());
  await writeFile(path.join(DIST, 'assets/.htaccess'), CACHE_FOREVER);
  if (existsSync(path.join(DIST, 'media'))) {
    await writeFile(path.join(DIST, 'media/.htaccess'), CACHE_FOREVER);
  }

  // Local config and the local database never leave your computer.
  await cp(path.join(ROOT, 'api'), path.join(DIST, 'api'), {
    recursive: true,
    filter: (source) => !/config\.local\.php$|[\\/]data([\\/]|$)/.test(source),
  });

  return { pageCount: pages.length, seconds: (Date.now() - startedAt) / 1000 };
}

// Only run when called directly (npm run build), not when imported by dev-server.ts.
const runDirectly =
  process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === import.meta.filename.toLowerCase();

if (runDirectly) {
  const args = process.argv.slice(2);
  build({ examples: args.includes('--examples'), includeDrafts: args.includes('--drafts') })
    .then(({ pageCount, seconds }) => console.log(`Built ${pageCount} pages in ${seconds.toFixed(1)}s`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
