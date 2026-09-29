const fs = require('fs');
const path = require('path');

const mobile = path.resolve(__dirname, '..');
const site = path.resolve(mobile, '..');
const signs = require(path.join(mobile, 'src/signs.json'));
const hazards = require(path.join(mobile, 'src/hazards.json'));

function assert(condition, message) { if (!condition) throw new Error(message); }
function localFile(url) { return path.join(site, decodeURI(url).replace(/^\//, '')); }

assert(signs.length === 147, `Expected 147 signs, found ${signs.length}`);
assert(new Set(signs.map((sign) => sign.code)).size === signs.length, 'Duplicate sign codes');
for (const sign of signs) {
  assert(sign.name && sign.explanation && sign.nameFa && sign.namePs, `Missing sign text: ${sign.code}`);
  assert(!/[A-Za-z]{2,}/.test(sign.nameFa), `Mixed Dutch/Farsi sign title: ${sign.code}`);
  assert(fs.existsSync(localFile(new URL(sign.image).pathname)), `Missing sign image: ${sign.code}`);
}
assert(hazards.length === 30, `Expected 30 situations, found ${hazards.length}`);
for (const [index, hazard] of hazards.entries()) {
  for (const locale of ['nl', 'fa', 'ps']) {
    assert(hazard.question[locale] && hazard.explanation[locale], `Missing ${locale} situation ${index + 1}`);
  }
  assert(['rem', 'gas', 'nothing'].includes(hazard.answer), `Invalid answer ${index + 1}`);
  if (hazard.image) assert(fs.existsSync(localFile(hazard.image)), `Missing situation image ${index + 1}`);
}
console.log(`${signs.length} borden en ${hazards.length} verkeerssituaties gecontroleerd.`);
