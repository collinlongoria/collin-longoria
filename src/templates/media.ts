import type { Media } from '../lib/images.ts';
import { html, type SafeHtml } from '../lib/html.ts';

interface MediaOptions {
  alt?: string;
  // Tells the browser how wide the image shows up, so it can pick the right size from srcset.
  sizes?: string;
  className?: string;
  // For images near the top of the page: load right away instead of lazily.
  priority?: boolean;
}

export function mediaTag(media: Media, options: MediaOptions = {}): SafeHtml {
  const className = [options.className, media.isPixelArt ? 'pixelated' : ''].filter(Boolean).join(' ');

  if (media.isVideo) {
    return html`<video src="${media.url}" class="${className}" autoplay loop muted playsinline controls></video>`;
  }

  return html`<img
    src="${media.url}"
    ${media.srcset && html`srcset="${media.srcset}" sizes="${options.sizes ?? '100vw'}"`}
    ${media.width && html`width="${media.width}" height="${media.height ?? ''}"`}
    alt="${options.alt ?? ''}"
    class="${className}"
    ${options.priority ? html`fetchpriority="high"` : html`loading="lazy"`}
    decoding="async"
  />`;
}
