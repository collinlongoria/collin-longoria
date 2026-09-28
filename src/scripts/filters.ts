// The "all / books / short stories…" buttons. Each item lists the values it matches in
// data-filter-values (separated by "|"); picking a filter hides everything else.

function applyFilter(area: HTMLElement, value: string): void {
  for (const button of area.querySelectorAll<HTMLElement>('[data-filter]')) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === value));
  }

  // The blog swaps its front page layout for a plain list while a filter is on.
  const frontPage = area.querySelector<HTMLElement>('[data-front-page]');
  const filteredList = area.querySelector<HTMLElement>('[data-filtered-list]');
  if (frontPage && filteredList) {
    frontPage.hidden = value !== '';
    filteredList.hidden = value === '';
  }

  const items = (filteredList ?? area).querySelectorAll<HTMLElement>('[data-filter-values]');
  for (const item of items) {
    const values = (item.dataset.filterValues ?? '').split('|');
    item.hidden = value !== '' && !values.includes(value);
  }

  // Keep the filter in the URL so it survives a reload and can be linked to.
  const url = new URL(location.href);
  if (value) url.searchParams.set('filter', value);
  else url.searchParams.delete('filter');
  history.replaceState(null, '', url);
}

export function setUpFilters(): void {
  for (const area of document.querySelectorAll<HTMLElement>('[data-filter-area]')) {
    const buttons = area.querySelectorAll<HTMLElement>('[data-filter]');
    for (const button of buttons) {
      button.addEventListener('click', () => applyFilter(area, button.dataset.filter ?? ''));
    }

    const fromUrl = new URL(location.href).searchParams.get('filter');
    if (fromUrl && [...buttons].some((button) => button.dataset.filter === fromUrl)) {
      applyFilter(area, fromUrl);
    }
  }
}
