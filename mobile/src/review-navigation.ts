export function reviewNeighbors(index: number, questionCount: number, filteredIndices?: number[]) {
  if (filteredIndices) {
    const position = filteredIndices.indexOf(index);
    if (position < 0) return { previousIndex: undefined, nextIndex: undefined };
    return {
      previousIndex: filteredIndices[position - 1],
      nextIndex: filteredIndices[position + 1]
    };
  }
  return {
    previousIndex: index > 0 ? index - 1 : undefined,
    nextIndex: index + 1 < questionCount ? index + 1 : undefined
  };
}
