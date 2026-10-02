import type { ContentBlock, Locale, LocalizedContent } from './types';

export function localizedText(value: LocalizedContent | undefined, locale: Locale): string {
  if (typeof value === 'string') return value;
  if (!value) return '';
  return value[locale] || value.nl || value.fa || value.ps || '';
}

export function mediaUrl(src: string | undefined): string | null {
  if (!src) return null;
  if (/^https:\/\//i.test(src)) return src;
  if (!src.startsWith('/')) return null;
  return `https://www.mursaltheorie.nl${encodeURI(src)}`;
}

export function isQuiz(block: ContentBlock): block is ContentBlock & {
  question: LocalizedContent;
  options: LocalizedContent[];
  correctOption: number;
  explanation?: LocalizedContent;
} {
  return block.type === 'quiz'
    && Array.isArray(block.options)
    && block.options.length > 1
    && typeof block.correctOption === 'number'
    && Number.isInteger(block.correctOption)
    && block.correctOption >= 0
    && block.correctOption < block.options.length;
}
