import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../learn5.html', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../learn5.source.html', import.meta.url), 'utf8');
const logo = new URL('../images/mursal-logo.png', import.meta.url);

test('Dari/Farsi language controls use their own script', () => {
  assert.match(home, /id="langBtn" lang="fa" dir="rtl">دری\/فارسی</);
  assert.match(home, /lang==='nl'\?'دری\/فارسی':'NL'/);
  for (const shell of [app, source]) {
    assert.match(shell, /onclick="setLanguage\('fa'\)" lang=fa dir=rtl>دری\/فارسی/);
    assert.doesNotMatch(shell, />Dari<\/button>/);
  }
});

test('speech button is a real start-stop toggle on mobile and desktop', () => {
  for (const shell of [app, source]) {
    assert.match(shell, /let activeSpeech=null/);
    assert.match(shell, /id=speechToggle/);
    assert.match(shell, /activeSpeech\|\|speechSynthesis\.speaking\|\|speechSynthesis\.pending/);
    assert.match(shell, /stopSpeaking\(\);return/);
    assert.match(shell, /speaking\?'🔇':'🔊'/);
    assert.match(shell, /aria-pressed="\$\{speaking\}"/);
  }
});

test('all exam image views recover from missing or broken media', () => {
  for (const shell of [app, source]) {
    assert.match(shell, /function examQuestionImage\(q\)/);
    assert.match(shell, /data-fallback=/);
    assert.match(shell, /onerror="this\.onerror=null;this\.src=this\.dataset\.fallback"/);
    assert.equal((shell.match(/\$\{examQuestionImage\(q\)\}/g) || []).length, 3);
    assert.doesNotMatch(shell, /<img src="\$\{q\.image\|\|sceneImage\(q\.scene\)\}"/);
  }
});

test('latest Mursal logo is used for header marks and favicons', () => {
  assert.ok(fs.statSync(logo).size > 30_000);
  assert.match(home, /rel="icon" type="image\/png" href="\/images\/mursal-logo\.png"/);
  assert.match(home, /class="logo"><img src="\/images\/mursal-logo\.png" alt="Mursal">/);
  for (const shell of [app, source]) {
    assert.match(shell, /rel="icon" type="image\/png" href="\/images\/mursal-logo\.png"/);
    assert.match(shell, /<img src="\/images\/mursal-logo\.png" alt="Mursal"[^>]*>/);
  }
});

