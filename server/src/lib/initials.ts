// "Demo Volunteer" → "DV", "Tomás Silva" → "TS", "Cher" → "CH"
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';

  // Array.from splits by character, so accented or non-Latin letters stay whole
  const firstLetters = (word: string, count: number) => Array.from(word).slice(0, count).join('');
  const letters =
    words.length === 1
      ? firstLetters(words[0]!, 2)
      : firstLetters(words[0]!, 1) + firstLetters(words[words.length - 1]!, 1);
  return letters.toUpperCase();
}
