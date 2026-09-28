// Getting images from your computer into a post.

export function isMediaFile(name: string): boolean {
  return /\.(png|jpe?g|webp|gif|avif|svg|mp4|webm)$/i.test(name);
}

export function isTextFile(name: string): boolean {
  return /\.(md|fountain)$/i.test(name);
}

// Lowercase, no spaces, and not already taken: "My Screenshot.PNG" → "my-screenshot.png".
export function uniqueFileName(name: string, taken: Set<string>): string {
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot).toLowerCase() : '';
  const base =
    (dot > 0 ? name.slice(0, dot) : name)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file';

  let candidate = base + extension;
  for (let n = 2; taken.has(candidate); n++) candidate = `${base}-${n}${extension}`;
  return candidate;
}

// Huge screenshots are shrunk before uploading so the repo doesn't fill up with 10 MB PNGs.
// The build makes smaller versions for the site anyway. Pixel art and GIFs are left alone.
export async function shrinkIfHuge(file: File): Promise<File> {
  const shrinkable = /^image\/(png|jpeg|webp)$/.test(file.type) && !/\.pixel\./i.test(file.name);
  if (!shrinkable) return file;

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    return file;
  }
  if (image.width <= 2400 && file.size <= 3_000_000) return file;

  const scale = Math.min(1, 2400 / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
}

// The API takes file contents as base64 text inside the JSON.
export async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  // In chunks, because String.fromCharCode can't take millions of arguments at once.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
