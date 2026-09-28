import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { VIDEO_EXTENSIONS } from '../shared/schema.ts';

export interface Media {
  url: string;
  srcset?: string;
  width?: number;
  height?: number;
  isVideo: boolean;
  isPixelArt: boolean;
}

const SIZES = [480, 960, 1600, 2400];

// Photos and screenshots get resized into a few WebP sizes so phones don't download
// 4K screenshots. GIFs, SVGs, videos and pixel art (".pixel." in the name) are copied as-is.
export class MediaProcessor {
  private outputDir: string;
  private cacheDir: string;
  private processed = new Map<string, Promise<Media>>();

  constructor(outputDir: string, cacheDir: string) {
    this.outputDir = outputDir;
    this.cacheDir = cacheDir;
  }

  // urlFolder is where the files end up on the site, e.g. "media/blog/my-post".
  process(filePath: string, urlFolder: string): Promise<Media> {
    const key = `${filePath}|${urlFolder}`;
    if (!this.processed.has(key)) {
      this.processed.set(key, this.processFile(filePath, urlFolder));
    }
    return this.processed.get(key)!;
  }

  private async processFile(filePath: string, urlFolder: string): Promise<Media> {
    const file = await readFile(filePath);
    // The hash in the file name means browsers can cache these forever.
    const hash = createHash('sha1').update(file).digest('hex').slice(0, 10);
    const extension = path.extname(filePath).toLowerCase();
    const isPixelArt = /\.pixel\.[a-z]+$/i.test(filePath);
    const baseName = path
      .basename(filePath, extension)
      .replace(/\.pixel$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-');

    await mkdir(path.join(this.outputDir, urlFolder), { recursive: true });

    const copyAsIs = async () => {
      const name = `${baseName}-${hash}${extension}`;
      await copyFile(filePath, path.join(this.outputDir, urlFolder, name));
      return `/${urlFolder}/${name}`;
    };

    if (VIDEO_EXTENSIONS.includes(extension)) {
      return { url: await copyAsIs(), isVideo: true, isPixelArt: false };
    }

    if (extension === '.svg') {
      return { url: await copyAsIs(), isVideo: false, isPixelArt };
    }

    if (extension === '.gif' || isPixelArt) {
      const info = await sharp(file, { animated: true }).metadata();
      return {
        url: await copyAsIs(),
        width: info.width,
        // For animated GIFs "height" is all frames stacked; pageHeight is one frame.
        height: info.pageHeight ?? info.height,
        isVideo: false,
        isPixelArt,
      };
    }

    const info = await sharp(file).rotate().metadata();
    const originalWidth = info.autoOrient?.width ?? info.width ?? 1600;
    const originalHeight = info.autoOrient?.height ?? info.height ?? 900;

    const widths = SIZES.filter((size) => size < originalWidth);
    widths.push(Math.min(originalWidth, 2400));

    await mkdir(this.cacheDir, { recursive: true });
    const srcset: string[] = [];
    let largestUrl = '';

    for (const width of new Set(widths)) {
      const name = `${baseName}-${hash}-${width}.webp`;
      const cached = path.join(this.cacheDir, name);
      if (!existsSync(cached)) {
        await sharp(file).rotate().resize({ width }).webp({ quality: 82 }).toFile(cached);
      }
      await copyFile(cached, path.join(this.outputDir, urlFolder, name));
      largestUrl = `/${urlFolder}/${name}`;
      srcset.push(`${largestUrl} ${width}w`);
    }

    const scale = Math.min(1, 2400 / originalWidth);
    return {
      url: largestUrl,
      srcset: srcset.join(', '),
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
      isVideo: false,
      isPixelArt: false,
    };
  }
}
