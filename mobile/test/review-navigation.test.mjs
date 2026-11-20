import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewNeighbors } from '../src/review-navigation.ts';

test('wrong-answer review skips correct questions and stops at the last wrong answer', () => {
  const wrong = [1, 4, 6];
  assert.deepEqual(reviewNeighbors(1, 10, wrong), { previousIndex: undefined, nextIndex: 4 });
  assert.deepEqual(reviewNeighbors(4, 10, wrong), { previousIndex: 1, nextIndex: 6 });
  assert.deepEqual(reviewNeighbors(6, 10, wrong), { previousIndex: 4, nextIndex: undefined });
  assert.deepEqual(reviewNeighbors(9, 10), { previousIndex: 8, nextIndex: undefined });
});
