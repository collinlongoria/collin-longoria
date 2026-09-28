// Collapsing the sidebar on desktop, and the slide-out menu on phones.

const root = document.documentElement;

function setMenuOpen(open: boolean): void {
  root.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

export function setUpSidebar(): void {
  document.querySelector('[data-toggle-sidebar]')?.addEventListener('click', () => {
    const collapsed = root.classList.toggle('sidebar-collapsed');
    try {
      localStorage.setItem('sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      // Private browsing can block storage. The toggle still works for this page.
    }
  });

  document.querySelector('[data-open-menu]')?.addEventListener('click', () => setMenuOpen(true));

  for (const closer of document.querySelectorAll('[data-close-menu], .sidebar a')) {
    closer.addEventListener('click', () => setMenuOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}
