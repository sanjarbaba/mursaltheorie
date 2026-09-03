export function mutationId(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length >= 8 && normalized.length <= 120 ? normalized : null;
}

export const QUESTION_TYPES = Object.freeze([
  'single_choice',
  'multiple_response',
  'yes_no',
  'numeric',
  'hotspot'
]);

export function questionType(value) {
  return QUESTION_TYPES.includes(value) ? value : 'single_choice';
}

export function normalizeAnswer(type, value, optionCount = 0) {
  const normalizedType = questionType(type);
  if (normalizedType === 'multiple_response') {
    if (!Array.isArray(value)) return null;
    const answers = [...new Set(value.map(Number))].sort((a, b) => a - b);
    return answers.length && answers.every((answer) => Number.isInteger(answer) && answer >= 0 && answer < optionCount)
      ? answers
      : null;
  }
  if (normalizedType === 'numeric') {
    const answer = typeof value === 'string' ? value.trim().replace(',', '.') : value;
    const number = Number(answer);
    return Number.isFinite(number) ? number : null;
  }
  const answer = Number(value);
  return Number.isInteger(answer) && answer >= 0 && answer < optionCount ? answer : null;
}

export function answersEqual(type, answer, correctAnswer) {
  const normalizedType = questionType(type);
  if (normalizedType === 'multiple_response') {
    return Array.isArray(answer) && Array.isArray(correctAnswer)
      && answer.length === correctAnswer.length
      && answer.every((value, index) => value === correctAnswer[index]);
  }
  if (normalizedType === 'numeric') return Number(answer) === Number(correctAnswer);
  return answer === correctAnswer;
}

export function publicQuestion(row, language, localized) {
  return {
    id: Number(row.id),
    prompt: localized(row.prompt, language),
    options: Array.isArray(row.options)
      ? row.options.map((option) => typeof option === 'string' ? option : localized(option, language))
      : [],
    category: row.category,
    questionType: questionType(row.question_type),
    media: Array.isArray(row.media) ? row.media : [],
    sortOrder: row.sort_order
  };
}

export function percentage(correct, total) {
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1) return 0;
  return Math.round((correct / total) * 100);
}

