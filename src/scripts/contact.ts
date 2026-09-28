import { api, errorMessage } from './api.ts';
import { addCaptcha } from './captcha.ts';
import { formValues, showFormMessage } from './dom.ts';

export async function setUpContactForm(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]')!;
  const captcha = await addCaptcha(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    button.disabled = true;
    showFormMessage(form, 'sending…');

    try {
      await api('contact.php', { body: { ...formValues(form), captcha: captcha.token() } });
      form.reset();
      showFormMessage(form, 'sent');
    } catch (error) {
      showFormMessage(form, errorMessage(error), true);
    }

    captcha.reset();
    button.disabled = false;
  });
}
