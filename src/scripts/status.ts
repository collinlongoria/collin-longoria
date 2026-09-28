// The "Currently feeling …" line in the sidebar.

import { api } from './api.ts';
import { feelingLine } from '../shared/thought-text.ts';

// Remembered for a few minutes so clicking around the site doesn't ask the server every time.
const CACHE_KEY = 'status';
const CACHE_MINUTES = 5;

export function showStatus(feeling: string | null): void {
  const box = document.querySelector<HTMLElement>('[data-status]');
  const text = document.querySelector('[data-status-text]');
  if (!box || !text) return;

  box.hidden = !feeling;
  if (feeling) {
    text.textContent = feelingLine(feeling);
    box.title = feelingLine(feeling);
  }
}

export function forgetStatus(): void {
  sessionStorage.removeItem(CACHE_KEY);
}

export async function loadStatus(): Promise<void> {
  const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
  if (cached && Date.now() - cached.savedAt < CACHE_MINUTES * 60_000) {
    showStatus(cached.feeling);
    return;
  }

  try {
    const { feeling } = await api<{ feeling: string | null }>('status.php');
    showStatus(feeling);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ feeling, savedAt: Date.now() }));
  } catch {
    showStatus(null);
  }
}
