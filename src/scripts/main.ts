// Runs on every page. Code for a specific page is only downloaded when that page needs it.

import { setUpSidebar } from './sidebar.ts';
import { setUpFilters } from './filters.ts';
import { checkSession, setUpLogin } from './login.ts';
import { loadStatus } from './status.ts';

setUpSidebar();
setUpFilters();
setUpLogin();
loadStatus();

const loggedIn = await checkSession();

if (document.querySelector('[data-thought-list]')) {
  import('./thoughts.ts').then((module) => module.setUpThoughts(loggedIn));
}
if (document.querySelector('[data-entry-list]')) {
  import('./guestbook.ts').then((module) => module.setUpGuestbook(loggedIn));
}
if (document.querySelector('[data-contact-form]')) {
  import('./contact.ts').then((module) => module.setUpContactForm());
}
if (document.querySelector('[data-admin]') && loggedIn) {
  import('./admin/editor.ts').then((module) => module.setUpAdmin());
}
