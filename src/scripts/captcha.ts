// Cloudflare Turnstile, the "are you human?" check. Does nothing when no site key is set.

export interface Captcha {
  token(): string;
  reset(): void;
}

const noCaptcha: Captcha = { token: () => '', reset: () => {} };
let scriptLoading: Promise<void> | undefined;

function loadScript(): Promise<void> {
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.append(script);
  });
  return scriptLoading;
}

// Draws the widget inside the form's [data-turnstile] box.
export async function addCaptcha(form: HTMLElement): Promise<Captcha> {
  const box = form.querySelector<HTMLElement>('[data-turnstile]');
  if (!TURNSTILE_SITE_KEY || !box) return noCaptcha;

  try {
    await loadScript();
  } catch {
    return noCaptcha;
  }

  const widget = window.turnstile!.render(box, { sitekey: TURNSTILE_SITE_KEY, theme: 'dark' });
  return {
    token: () => window.turnstile?.getResponse(widget) ?? '',
    reset: () => window.turnstile?.reset(widget),
  };
}
