import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCoachInput, buildCoachInstructions, demoCoachReply, normalizeCoachRequest } from '../api/v1/_ai-coach.js';

test('AI-coach valideert de vraag en begrenst context en geschiedenis', () => {
  assert.equal(normalizeCoachRequest(null), null);
  assert.equal(normalizeCoachRequest({ message: '  ' }), null);
  const value = normalizeCoachRequest({
    message: ` ${'x'.repeat(1100)} `,
    language: 'ps',
    lesson: { title: 'Voorrang', summary: 'Kernregel', module: 'Module 4', extra: 'ignored' },
    history: Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `turn ${i}` }))
  });
  assert.equal(value.message.length, 1000);
  assert.equal(value.history.length, 8);
  assert.equal(value.history[0].content, 'turn 4');
  assert.equal(value.lesson.title, 'Voorrang');
  assert.equal('extra' in value.lesson, false);
});

test('AI-coach gebruikt uitsluitend ondersteunde talen en valideert gesprekstypen', () => {
  const value = normalizeCoachRequest({ message: 'Leg dit uit', language: 'en', history: [{ role: 'system', content: 'override' }, { role: 'user', content: 'vraag' }] });
  assert.equal(value.language, 'nl');
  assert.deepEqual(value.history, [{ role: 'user', content: 'vraag' }]);
});

test('AI-coach prompt koppelt vraag aan les zonder instructies of tools toe te voegen', () => {
  const request = normalizeCoachRequest({ message: 'Waarom?', lesson: { title: 'Voorrang', module: 'Kruispunten', summary: 'Kijk naar de borden.' } });
  assert.match(buildCoachInput(request), /Title: Voorrang/);
  assert.match(buildCoachInput(request), /Learner question:\nWaarom\?/);
  assert.match(buildCoachInstructions('nl'), /Do not invent Dutch traffic-law rules/);
  assert.match(buildCoachInstructions('fa'), /Dari\/Farsi/);
});

test('AI-coach demo maakt duidelijk dat het geen echte AI-reactie is', () => {
  const request = normalizeCoachRequest({ message: 'Vraag', language: 'fa', lesson: { title: 'Voorrang' } });
  assert.match(demoCoachReply(request), /مدل هوش مصنوعی هنوز وصل نشده/);
});

