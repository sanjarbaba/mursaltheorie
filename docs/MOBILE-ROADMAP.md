# Mursaltheorie mobile roadmap

## Doelarchitectuur

De website en toekomstige Expo-apps voor iOS en Android gebruiken dezelfde
versieerbare Vercel API, Clerk-identiteit en Neon-database. UI-code wordt niet
gedeeld; API-contracten, gegevenstypen en content wel.

## Fase 1 — API-fundering

- [x] Voeg `/api/v1` toe zonder bestaande `/api/*` routes te breken.
- [x] Gebruik vaste responsevormen en machineleesbare foutcodes.
- [x] Maak Clerk authorized parties configureerbaar via een servervariabele.
- [x] Voeg contracttests toe.
- [x] Implementeer v1 examenpogingen met server-side antwoordcontrole.
- [x] Voeg schema-validatie en idempotency voor schrijfrequests toe.

## Fase 2 — Datamodel en migraties

- [x] Introduceer genummerde, herhaalbaar uitvoerbare SQL-migraties.
- [x] Modelleer lessen als versieerbare contentblokken.
- [x] Modelleer examens, vragen, antwoorden en uitleg afzonderlijk.
- [x] Voeg entitlements en onveranderlijke purchase events toe.
- [x] Voeg sync metadata toe aan voortgang.
- [x] Voer migratie 001 uit op Neon previewbranch `preview/codex/mobile-api-v1-foundation` en verifieer de tabellen.
- [x] Voeg een idempotente migratie voor bestaande beta-toegang naar entitlements toe.
- [x] Voer migratie 002 uit op de Neon previewbranch en verifieer aantallen en idempotentie.

## Fase 3 — Contentmigratie

- [x] Extraheer 150 lessen en 30 unieke vragen reproduceerbaar uit `learn5.html`.
- [x] Voer contentmigratie 003 uit op Neon preview en verifieer aantallen en idempotentie.
- [ ] Vul ontbrekende unieke lesinhoud aan.
- [x] Verwijder juiste antwoorden uit publieke payloads.
- [x] Laat de website uitsluitend de v1-content- en examen-API gebruiken.

## Fase 4 — Expo-app

- [x] Maak een TypeScript Expo-project met Expo Router.
- [x] Voeg Clerk Expo met versleutelde tokenopslag en voorlopige native identifiers toe.
- [ ] Registreer en bevestig iOS bundle ID en Android package name in Clerk en de stores.
- [x] Implementeer een accountgebonden, offline voortgangsqueue met conflictbehandeling.
- [x] Implementeer veilige native tokenopslag, SQLite-lescache en voortgangsqueue.
- [ ] Bouw lessen, examens, resultaten en accountbeheer native.

## Fase 5 — Betalingen en publicatie

- [ ] Koppel web-, Apple- en Google-aankopen aan centrale entitlements.
- [ ] Verifieer aankopen en webhooks server-side en idempotent.
- [ ] Voeg aankoopherstel, accountverwijdering en privacyflows toe.
- [ ] Test via TestFlight en Google Play internal testing.

