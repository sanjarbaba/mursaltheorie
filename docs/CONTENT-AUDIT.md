# Content audit â€” 2 September 2026

The seed migration is now audited reproducibly with `node scripts/audit-content.mjs database/migrations/003_seed_learn5_content.sql`.

## Baseline findings

- 150 lessons and 30 exam questions are present.
- All questions have Dutch/Dari prompts, at least two options, a valid correct-option index, explanations, and media.
- One lesson has no Dutch summary.
- 87 lesson summaries use the same generic Dutch priority sentence; all 150 Dari summaries use the same generic sentence.
- All 30 question explanations are identical generic text.
- No lesson or question is missing media in the seed data.

The audit deliberately reports duplication instead of silently rewriting traffic-law content. The next content pass must replace ^iÈ`zw«‰Ë.šf«Ë÷±¦V§jØ¨Ÿ­†Ú)‰Ë)yÈŸ‰ÀîµÈZĞÚ®+^ÆÖ§v·¯‰ì-…è¦jš¨§²Ûaz«²Ø¨