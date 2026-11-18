import test from 'node:test';
import assert from 'node:assert/strict';
import { localizedText } from '../src/content.ts';
test('Dutch remains available next to Dari/Farsi and Pashto', () => {
  const text = { nl: 'Voorrang', fa: 'حق تقدم', ps: 'د تېرېدو لومړیتوب' };
  assert.equal(localizedText(text, 'nl'), 'Voorrang');
  assert.equal(localizedText(text, 'fa'), text.fa);
  assert.equal(localizedText(text, 'ps'), text.ps);
});
test('missing Pashto falls back to Dutch, never Dari', () => {
  assert.equal(localizedText({ nl: 'Voorrang', fa: 'حق تقدم' }, 'ps'), 'Voorrang');
  assert.equal(localizedText({ fa: 'حق تقدم' }, 'ps'), '');
});
