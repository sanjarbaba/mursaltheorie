export type LocalizedContent = string | { nl?: string; fa?: string };

export type ContentBlock = {
  type: string;
  text?: LocalizedContent;
  title?: LocalizedContent;
  [key: string]: unknown;
};

export type Lesson = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  contentBlocks: ContentBlock[];
  media: Array<{ type?: string; src?: string; alt?: LocalizedContent }>;
  estimatedMinutes: number;
  sortOrder: number;
  module: { number: number; slug: string; title: string };
};

export type LessonsResponse = {
  release: { version: number; publishedAt: string } | null;
  lessons: Lesson[];
  locale: 'nl' | 'fa';
};

export type ProgressMutation = {
  lessonId: number;
  completed: boolean;
  progressPercent: number;
  clientUpdatedAt: string;
  deviceId: string;
  mutationId: string;
};

