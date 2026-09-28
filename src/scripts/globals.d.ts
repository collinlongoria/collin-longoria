// Replaced with the value from src/config.ts when the scripts are bundled (see build.ts).
declare const TURNSTILE_SITE_KEY: string;

interface Window {
  turnstile?: {
    render(element: HTMLElement, options: { sitekey: string; theme?: string }): string;
    getResponse(widgetId: string): string | undefined;
    reset(widgetId: string): void;
  };
}
