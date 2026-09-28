// Mirrors api/includes/thoughts.php. If you change one, change the other.

export const MAX_THOUGHT_LENGTH = 280; // X's limit. Threads allows 500, so X is the one that matters.
export const MAX_FEELING_LENGTH = 80;

export function feelingLine(feeling: string): string {
  return `Currently feeling ${feeling.trim()}`;
}

// The exact text that gets posted to X and Threads.
export function crossPostText(body: string, feeling?: string | null): string {
  const text = body.trim();
  const mood = feeling?.trim();
  if (!mood) return text;
  return `${text}\n\n${feelingLine(mood)}`;
}

// X doesn't count characters one-for-one: any link counts as 23, and CJK text
// and emoji count double. This follows the same rules.
export function postLength(text: string): number {
  let length = 0;

  const withoutLinks = text.replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, () => {
    length += 23;
    return '';
  });

  const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const { segment } of graphemes.segment(withoutLinks.normalize('NFC'))) {
    if (/\p{Extended_Pictographic}/u.test(segment)) {
      length += 2;
      continue;
    }
    for (const char of segment) {
      length += isNarrow(char.codePointAt(0)!) ? 1 : 2;
    }
  }

  return length;
}

function isNarrow(codePoint: number): boolean {
  return (
    codePoint <= 4351 ||
    (codePoint >= 8192 && codePoint <= 8205) ||
    (codePoint >= 8208 && codePoint <= 8223) ||
    (codePoint >= 8242 && codePoint <= 8247)
  );
}
