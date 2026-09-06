import fs from 'node:fs';
import path from 'node:path';

const migration = process.argv[2] ?? path.resolve('database/migrations/003_seed_learn5_content.sql');
const source = fs.readFileSync(migration, 'utf8');
const blocks = [...source.matchAll(/\$content\$([\s\S]*?)\$content\$::jsonb/g)].map((match) => JSON.parse(match[1]));
const lessons = blocks.flat().filter((item) => item.lessonNumber !== undefined);
const questions = blocks.flat().filter((item) => item.externalKey !== undefined);

const duplicates = (values) => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
};

const translatedText = (value, language) => {
  if (!value || typeof value !== 'object') return '';
  return typeof value[language] === 'string' ? value[language].trim() : '';
};

const issue = (lesson, kind, detail) => ({
  lesson: lesson.lessonNumber,
  title: translatedText(lesson.title, 'nl'),
  kind,
  detail,
});

const issues = [];
for (const lesson of lessons) {
  const blocksForLesson = Array.isArray(lesson.contentBlocks) ? lesson.contentBlocks : [];
  const quiz = blocksForLesson.find((block) => block.type === 'quiz');
  const rule = blocksForLesson.find((block) => block.type === 'rule');
  const tip = blocksForLesson.find((block) => block.type === 'exam_tip');
  const media = Array.isArray(lesson.media) ? lesson.media : [];

  if (!translatedText(lesson.title, 'nl') || !translatedText(lesson.title, 'fa')) {
    issues.push(issue(lesson, 'translation', 'Titel mist Nederlands of Dari/Farsi.'));
  }
  if (!rule || !translatedText(rule.text, 'nl') || !translatedText(rule.text, 'fa')) {
    issues.push(issue(lesson, 'rule', 'Kernregel mist Nederlands of Dari/Farsi.'));
  }
  if (!tip || !translatedText(tip.text, 'nl') || !translatedText(tip.text, 'fa')) {
    issues.push(issue(lesson, 'exam_tip', 'Examentip mist Nederlands of Dari/Farsi.'));
  }
  if (!quiz) {
    issues.push(issue(lesson, 'quiz', 'Quiz ontbreekt.'));
  } else {
    const options = Array.isArray(quiz.options) ? quiz.options : [];
    const correctOption = Number(quiz.correctOption);
    if (!translatedText(quiz.question, 'nl') || !translatedText(quiz.question, 'fa')) {
      issues.push(issue(lesson, 'quiz', 'Quizvraag mist Nederlands of Dari/Farsi.'));
    }
    if (options.length < 2 || options.some((option) => !translatedText(option, 'nl') || !translatedText(option, 'fa'))) {
      issues.push(issue(lesson, 'quiz', 'Quizopties zijn onvolledig of niet tweetalig.'));
    }
    if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption >= options.length) {
      issues.push(issue(lesson, 'quiz', `Ongeldige juiste antwoordindex: ${quiz.correctOption}.`));
    }
    if (!translatedText(quiz.explanation, 'nl') || !translatedText(quiz.explanation, 'fa')) {
      issues.push(issue(lesson, 'quiz', 'Uitleg mist Nederlands of Dari/Farsi.'));
    }
  }
  if (!media.length || media.some((item) => !item.src)) {
    issues.push(issue(lesson, 'media', 'Afbeelding ontbreekt.'));
  }
}

const duplicateRules = duplicates(
  lessons.map((lesson) => lesson.contentBlocks?.find((block) => block.type === 'rule')?.text?.nl).filter(Boolean),
);
const duplicateTips = duplicates(
  lessons.map((lesson) => lesson.contentBlocks?.find((block) => block.type === 'exam_tip')?.text?.nl).filter(Boolean),
);
const duplicateMedia = duplicates(
  lessons.flatMap((lesson) => lesson.media?.map((item) => item.src) ?? []).filter(Boolean),
);

const report = {
  lessons: lessons.length,
  seededQuestions: questions.length,
  structuralIssues: issues.length,
  duplicateRules: duplicateRules.slice(0, 20).map(([text, count]) => ({ count, text })),
  duplicateExamTips: duplicateTips.slice(0, 20).map(([text, count]) => ({ count, text })),
  reusedImages: duplicateMedia.slice(0, 30).map(([src, count]) => ({ count, src })),
  issues,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = issues.length ? 1 : 0;
