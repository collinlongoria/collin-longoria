import { api, errorMessage, setCsrfToken } from './api.ts';
import { addCaptcha, type Captcha } from './captcha.ts';
import { showFormMessage } from './dom.ts';

const root = document.documentElement;

// The head script adds "logged-in" when the signed_in cookie is there. Confirm it with the
// server (and pick up the CSRF token) before showing any admin tools.
export async function checkSession(): Promise<boolean> {
  if (!root.classList.contains('logged-in')) return false;

  try {
    const session = await api<{ loggedIn: boolean; csrfToken?: string }>('session.php');
    if (session.loggedIn && session.csrfToken) {
      setCsrfToken(session.csrfToken);
      return true;
    }
  } catch {
    // Server unreachable: treat as logged out.
  }

  root.classList.remove('logged-in');
  return false;
}

export function setUpLogin(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#login-dialog');
  const form = dialog?.querySelector<HTMLFormElement>('[data-login-form]');
  if (!dialog || !form) return;

  let captcha: Captcha | undefined;

  for (const button of document.querySelectorAll('[data-open-login]')) {
    button.addEventListener('click', async () => {
      dialog.showModal();
      form.querySelector('input')?.focus();
      captcha ??= await addCaptcha(form);
    });
  }

  dialog.querySelector('[data-close-login]')?.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    showFormMessage(form, '');

    try {
      await api('login.php', { body: { password, captcha: captcha?.token() } });
      // Reload so every page script starts again knowing you're logged in.
      location.reload();
    } catch (error) {
      captcha?.reset();
      showFormMessage(form, errorMessage(error), true);
    }
  });

  for (const button of document.querySelectorAll('[data-logout]')) {
    button.addEventListener('click', async () => {
      await api('logout.php', { method: 'POST' }).catch(() => {});
      location.reload();
    });
  }
}
