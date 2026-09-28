import { navigation, site, socialLinks, type NavKey } from '../config.ts';
import { html, rawHtml, type SafeHtml } from '../lib/html.ts';
import type { SiteContent } from '../lib/content.ts';
import { formField } from './ui.ts';
import { socialIcon } from './social-icons.ts';

// Everything a template needs besides its own content.
export interface BuildContext {
  content: SiteContent;
  cssUrl: string;
  jsUrl: string;
  hasPublicFile(path: string): boolean;
}

export interface PageOptions {
  path: string;
  title?: string;
  description?: string;
  activeNav?: NavKey;
  // Reading pages start with the sidebar collapsed.
  collapseSidebar?: boolean;
  shareImage?: string;
  hideFromSearch?: boolean;
}

// Runs before the page is drawn so a collapsed sidebar or signed-in state doesn't flicker.
// Its hash is allowed in the Content-Security-Policy (see build.ts), so edit it there too if you change it.
export const HEAD_SCRIPT =
  'try{var c=document.documentElement.classList;' +
  "if(localStorage.getItem('sidebar')==='collapsed')c.add('sidebar-collapsed');" +
  "if(/(^|; )signed_in=1/.test(document.cookie))c.add('logged-in')}catch(e){}";

function logo(context: BuildContext, size = 40): SafeHtml {
  if (context.hasPublicFile('images/logo.png')) {
    return html`<img src="/images/logo.png" alt="" class="logo" width="${size}" height="${size}" />`;
  }
  return html`<span class="logo font-pixel" style="width:${size}px;height:${size}px" aria-hidden="true">C</span>`;
}

function navIcon(context: BuildContext, key: string, label: string): SafeHtml {
  const file = `images/icons/${key}.png`;
  if (context.hasPublicFile(file)) {
    return html`<img src="/${file}" alt="" class="nav-icon" />`;
  }
  return html`<span class="nav-letter" aria-hidden="true">${label[0]}</span>`;
}

const lockIcon = rawHtml(
  '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
    '<path d="M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z"/></svg>',
);

function sidebar(context: BuildContext, activeNav?: NavKey): SafeHtml {
  return html`
    <aside id="sidebar" class="sidebar" aria-label="Site">
      <div class="sidebar-brand">
        <a href="/" class="flex min-w-0 items-center gap-3" aria-label="Home">
          ${logo(context)}
          <span class="sidebar-label font-pixel">${site.name}</span>
        </a>
        <button type="button" class="close-menu ml-auto text-xl text-fg-2" data-close-menu aria-label="Close menu">
          ×
        </button>
      </div>

      <div class="status" data-status hidden>
        <span class="status-dot"></span>
        <span class="sidebar-label" data-status-text></span>
      </div>

      <nav>
        <ul class="nav">
          ${navigation.map(
            (item) => html`
              <li>
                <a
                  href="${item.href}"
                  class="nav-link font-pixel"
                  title="${item.label}"
                  ${item.key === activeNav && html`aria-current="page"`}
                >
                  ${navIcon(context, item.key, item.label)}
                  <span class="sidebar-label">${item.label}</span>
                </a>
              </li>
            `,
          )}
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="icon-button collapse-button" data-toggle-sidebar aria-label="Collapse sidebar">
          «
        </button>
        <span class="flex-1"></span>
        <button type="button" class="logged-out-only flex items-center gap-1.5" data-open-login title="Log in">
          ${lockIcon}<span class="sidebar-label">log in</span>
        </button>
        <a href="/admin/" class="admin-only sidebar-label">admin</a>
        <button type="button" class="admin-only flex items-center gap-1.5" data-logout title="Log out">
          <span class="sidebar-label">log out</span>
        </button>
      </div>
    </aside>
  `;
}

function topbar(context: BuildContext): SafeHtml {
  return html`
    <header class="topbar">
      <a href="/" class="flex items-center gap-2.5">
        ${logo(context, 32)}
        <span class="font-pixel">${site.name}</span>
      </a>
      <button type="button" class="menu-button" data-open-menu aria-label="Menu" aria-controls="sidebar">
        <span></span><span></span><span></span>
      </button>
    </header>
  `;
}

function loginDialog(): SafeHtml {
  return html`
    <dialog class="dialog" id="login-dialog">
      <form class="flex flex-col gap-4" data-login-form>
        <!-- Lets password managers remember the login. -->
        <input type="text" name="username" value="admin" autocomplete="username" hidden />
        ${formField('password', 'password', { type: 'password', required: true, autocomplete: 'current-password' })}
        <div data-turnstile></div>
        <div class="flex items-center gap-3">
          <button type="submit" class="button button-primary">Log in</button>
          <button type="button" class="meta hover:text-fg" data-close-login>cancel</button>
        </div>
        <p class="form-message" data-form-message></p>
      </form>
    </dialog>
  `;
}

// The year is whenever the site was last built, which is every time you publish something.
function footer(): SafeHtml {
  const links = socialLinks.filter((link) => link.url);

  return html`
    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${site.author}</p>
      ${
        links.length > 0 &&
        html`<ul class="social-links">
        ${links.map(
          (link) => html`
            <li>
              <a href="${link.url}" target="_blank" rel="noopener me" aria-label="${link.label}" title="${link.label}">
                ${socialIcon(link.icon)}
              </a>
            </li>
          `,
        )}
      </ul>`
      }
    </footer>
  `;
}

export function renderPage(context: BuildContext, page: PageOptions, content: SafeHtml): string {
  const title = page.title ? `${page.title} — ${site.author}` : site.author;
  const url = site.url + page.path;

  return html`<!doctype html>
    <html lang="${site.language}" class="${page.collapseSidebar && 'sidebar-collapsed'}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        ${page.description && html`<meta name="description" content="${page.description}" />`}
        <link rel="canonical" href="${url}" />

        <meta property="og:title" content="${page.title ?? site.author}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:type" content="website" />
        ${page.description && html`<meta property="og:description" content="${page.description}" />`}
        ${
          page.shareImage &&
          html`<meta property="og:image" content="${site.url + page.shareImage}" />
          <meta name="twitter:card" content="summary_large_image" />`
        }
        ${page.hideFromSearch && html`<meta name="robots" content="noindex" />`}

        <meta name="theme-color" content="#0a0a0b" />
        ${context.hasPublicFile('favicon.ico') && html`<link rel="icon" href="/favicon.ico" sizes="any" />`}
        ${context.hasPublicFile('icon.svg') && html`<link rel="icon" href="/icon.svg" type="image/svg+xml" />`}
        ${
          context.hasPublicFile('apple-touch-icon.png') &&
          html`<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
        }
        <link rel="alternate" type="application/rss+xml" title="Blog" href="/blog/rss.xml" />
        <link rel="alternate" type="application/rss+xml" title="Devlogs" href="/devlogs/rss.xml" />

        <link rel="preload" href="/fonts/silkscreen-400.woff2" as="font" type="font/woff2" crossorigin />
        <link rel="preload" href="/fonts/geist.woff2" as="font" type="font/woff2" crossorigin />
        <link rel="stylesheet" href="${context.cssUrl}" />
        <script>${rawHtml(HEAD_SCRIPT)}</script>
        <script type="module" src="${context.jsUrl}"></script>
      </head>

      <body>
        <div class="site">
          ${topbar(context)} ${sidebar(context, page.activeNav)}
          <div class="menu-backdrop" data-close-menu></div>

          <main id="main" class="main">
            <div class="main-inner">${content} ${footer()}</div>
          </main>
        </div>
        ${loginDialog()}
      </body>
    </html>`.value;
}
