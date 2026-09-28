import { site } from '../config.ts';
import { escapeHtml } from './html.ts';
import type { Post } from './content.ts';

// Feed readers need absolute URLs, and srcset confuses most of them.
function makeLinksAbsolute(markup: string): string {
  return markup.replace(/(src|href)="\/(?!\/)/g, `$1="${site.url}/`).replace(/ srcset="[^"]*"/g, '');
}

export function rssFeed(title: string, path: string, posts: Post[]): string {
  const items = posts.slice(0, 30).map((post) => {
    const url = `${site.url}/${post.section}/${post.slug}/`;
    const date = new Date(post.date.length === 10 ? `${post.date}T12:00:00Z` : post.date);
    const categories = post.tags.map((tag) => `<category>${escapeHtml(tag)}</category>`).join('');

    return `  <item>
    <title>${escapeHtml(post.title)}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${date.toUTCString()}</pubDate>
    ${categories}
    <description>${escapeHtml(makeLinksAbsolute(post.body.html))}</description>
  </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeHtml(title)} — ${escapeHtml(site.author)}</title>
  <link>${site.url}${path}</link>
  <atom:link href="${site.url}${path}rss.xml" rel="self" type="application/rss+xml"/>
  <description>${escapeHtml(title)}</description>
  <language>${site.language}</language>
${items.join('\n')}
</channel>
</rss>
`;
}

export function sitemap(paths: string[]): string {
  const urls = paths
    .filter((path) => path.endsWith('/') && !path.startsWith('/admin'))
    .map((path) => `  <url><loc>${site.url}${path}</loc></url>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}
