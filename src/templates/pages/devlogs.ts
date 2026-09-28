import { html } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { devlogRow } from '../cards.ts';
import { filterChips, pageTitle } from '../ui.ts';

export function devlogsPage(context: BuildContext): string {
  const { devlogs, games } = context.content;

  // Show the game's title instead of its folder name when the project is on the Games page.
  const projectName = (slug: string) => games.find((game) => game.slug === slug)?.title ?? slug;

  const projects = [...new Set(devlogs.map((post) => post.project).filter((p): p is string => !!p))];

  const content = html`
    <div class="flex flex-col gap-10" data-filter-area>
      <div class="flex flex-col gap-6">
        ${pageTitle('Devlogs')} ${filterChips(projects.map((slug) => ({ value: slug, label: projectName(slug) })))}
      </div>
      <div>${devlogs.map((post) => devlogRow(post, post.project && projectName(post.project)))}</div>
    </div>
  `;

  return renderPage(context, { path: '/devlogs/', title: 'Devlogs', activeNav: 'devlogs' }, content);
}
