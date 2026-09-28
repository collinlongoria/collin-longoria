// Local development: `npm run dev` (your content) or `npm run dev:examples` (placeholder content).
//
// - rebuilds the site whenever you save a file, and reloads the browser
// - runs the PHP API with PHP's built-in server, as a dry run: nothing gets posted, emailed
//   or pushed. Log in with the password "dev". Things that would have been sent to X,
//   Threads or your inbox are written to data/dry-run.log instead.

import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { build, ROOT } from './build.ts';

const useExamples = process.argv.includes('--examples');
const PORT = Number(process.env.PORT ?? 4321);
const PHP_PORT = PORT + 1;
const DIST = path.join(ROOT, 'dist');
const CONTENT_DIR = path.join(ROOT, useExamples ? 'examples/content' : 'content');

const browsers = new Set<http.ServerResponse>();
let currentBuild: Promise<void> | null = null;
let rebuildAgain = false;
// Whether the next rebuild includes changes to code (src/, api/, public/) or only to content.
let codeChanged = true;

async function rebuild(): Promise<void> {
  if (currentBuild) {
    rebuildAgain = true;
    return currentBuild;
  }

  const reason = codeChanged ? 'code' : 'content';
  codeChanged = false;

  currentBuild = build({ examples: useExamples, includeDrafts: true, dev: true })
    .then(({ pageCount, seconds }) => {
      console.log(`Built ${pageCount} pages in ${seconds.toFixed(1)}s`);
      for (const browser of browsers) browser.write(`data: ${reason}\n\n`);
    })
    .catch((error) => console.error('\nBuild failed:\n' + (error instanceof Error ? error.message : error) + '\n'));

  await currentBuild;
  currentBuild = null;

  if (rebuildAgain) {
    rebuildAgain = false;
    await rebuild();
  }
}

// The PHP extensions the API needs. On Windows, PHP ships with them but doesn't turn them on
// unless php.ini says so, so we turn them on from the command line instead.
const PHP_EXTENSIONS = ['pdo_sqlite', 'sqlite3', 'mbstring', 'curl', 'openssl', 'intl'];

function phpArguments(): string[] | null {
  const version = spawnSync('php', ['-r', 'echo PHP_BINARY, "\\n", implode(",", get_loaded_extensions());'], {
    encoding: 'utf8',
  });
  if (version.status !== 0) return null;

  const [binary = '', loaded = ''] = version.stdout.trim().split('\n');
  const loadedExtensions = loaded.toLowerCase().split(',');
  const missing = PHP_EXTENSIONS.filter((name) => !loadedExtensions.includes(name));

  const args: string[] = [];
  if (missing.length > 0) {
    args.push('-d', `extension_dir=${path.join(path.dirname(binary), 'ext')}`);
    for (const name of missing) args.push('-d', `extension=${name}`);
  }
  return args;
}

function startPhp(): boolean {
  const args = phpArguments();
  if (!args) {
    console.log("\nPHP is not installed, so thoughts, the guestbook, login and the admin won't work locally.");
    console.log('Install it with:  winget install PHP.PHP.8.4   (then open a new terminal)\n');
    return false;
  }

  mkdirSync(path.join(ROOT, 'data'), { recursive: true });

  // -S starts PHP's built-in web server; -t makes the repo root its folder, so /api/thoughts.php is api/thoughts.php.
  const php = spawn('php', [...args, '-S', `127.0.0.1:${PHP_PORT}`, '-t', ROOT], {
    env: { ...process.env, CONTENT_DIR },
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  // PHP logs every request to stderr. Only show the lines that look like problems.
  php.stderr.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString().split('\n')) {
      if (/error|warning|fatal|exception/i.test(line)) console.log(`[php] ${line.trim()}`);
    }
  });

  const stop = () => {
    php.kill();
    process.exit();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  return true;
}

function proxyToPhp(request: http.IncomingMessage, response: http.ServerResponse): void {
  const forward = http.request(
    { host: '127.0.0.1', port: PHP_PORT, path: request.url, method: request.method, headers: request.headers },
    (phpResponse) => {
      response.writeHead(phpResponse.statusCode ?? 502, phpResponse.headers);
      phpResponse.pipe(response);
    },
  );
  forward.on('error', () => {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'The PHP server is not running.' }));
  });
  request.pipe(forward);
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.map': 'application/json',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain',
};

// Added to every page so it reloads itself after a rebuild. The admin page doesn't reload when
// only content changed, since that's usually the admin itself saving and you'd lose your place.
const RELOAD_SCRIPT = `<script>
new EventSource('/__reload').onmessage = (event) => {
  if (event.data === 'content' && location.pathname.startsWith('/admin')) return;
  location.reload();
};
</script>`;

async function serveFile(url: URL, response: http.ServerResponse): Promise<void> {
  let file = path.join(DIST, decodeURIComponent(url.pathname));
  if (!file.startsWith(DIST)) {
    response.writeHead(403).end();
    return;
  }

  try {
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      file = path.join(file, 'index.html');
    }

    const type = CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    let body: Buffer | string = await readFile(file);
    if (type.startsWith('text/html')) body = body.toString().replace('</body>', `${RELOAD_SCRIPT}</body>`);

    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch {
    const notFound = path.join(DIST, '404.html');
    const page = existsSync(notFound) ? await readFile(notFound, 'utf8') : 'Not found';
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(page.replace('</body>', `${RELOAD_SCRIPT}</body>`));
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (url.pathname === '/__reload') {
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    response.write('\n');
    browsers.add(response);
    request.on('close', () => browsers.delete(response));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    proxyToPhp(request, response);
    return;
  }

  await currentBuild;
  await serveFile(url, response);
});

const phpRunning = startPhp();
await rebuild();

server.listen(PORT, () => {
  console.log(`\nhttp://localhost:${PORT}${useExamples ? '  (example content)' : ''}`);
  if (phpRunning) console.log('Local password: dev   (dry run, see data/dry-run.log)');
  console.log('');
});

// Rebuild when anything that ends up in the site changes. Saving several files at once
// triggers one rebuild, not one per file.
let waiting: NodeJS.Timeout | undefined;
for (const folder of ['src', 'public', 'api', path.relative(ROOT, CONTENT_DIR)]) {
  const fullPath = path.join(ROOT, folder);
  if (!existsSync(fullPath)) continue;

  watch(fullPath, { recursive: true }, () => {
    if (fullPath !== CONTENT_DIR) codeChanged = true;
    clearTimeout(waiting);
    waiting = setTimeout(rebuild, 150);
  });
}
