export function summarizeResults(results) {
  const submitted = Array.isArray(results) ? results.filter((result) => Number.isFinite(Number(result.score))) : [];
  const total = submitted.length;
  const passed = submitted.filter((result) => result.passed).length;
  const scores = submitted.map((result) => Number(result.score));
  return {
    total,
    passed,
    passRate: total ? Math.round((passed / total) * 100) : 0,
    bestScore: total ? Math.max(...scores) : null,
    averageScore: total ? Math.round(scores.reduce((sum, score) => sum + score, 0) / total) : null
  };
}

