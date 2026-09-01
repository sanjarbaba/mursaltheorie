export function mutationId(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length >= 8 && normalized.length <= 120 ? normalized : null;
}

export function publicQuestion(row, language, localized) {
  return {
    id: Number(row.id),
    prompt: localized(row.prompt, language),
    options: Array.isArray(row.options) ? row.options : [],
    category: row.category,
    media: Array.isArray(row.media) ? row.media : [],
    sortOrder: row.sort_order
  };
}

export function percentage(correct, total) {
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1) return 0;
  return Math.round((correct / total) * 100);
}
