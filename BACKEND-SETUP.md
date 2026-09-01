# Mursaltheorie backend activeren

De backendcode gebruikt Clerk voor identiteit en Neon Postgres voor duurzame opslag.

## Benodigde Vercel-variabelen

- `CLERK_SECRET_KEY`: productie-secret uit Clerk. Alleen op de server gebruiken.
- `DATABASE_URL`: wordt automatisch toegevoegd als Neon via de Vercel Marketplace wordt gekoppeld.

Stel beide variabelen in voor `Production` en `Preview`. Zet secrets nooit in Git of clientbestanden.

## Database aanmaken

1. Installeer Neon vanuit de Vercel Marketplace en koppel het aan project `mursaltheorie1`.
2. Open de Neon SQL Editor.
3. Voer `database/schema.sql` volledig uit.
4. Controleer of de tabellen `app_users`, `lesson_progress`, `exam_results`, `protected_lessons` en `protected_questions` bestaan.

## Tijdelijke toegang vóór betalingen

Nieuwe gebruikers krijgen `access_status = 'beta'`. Daardoor kunnen testgebruikers de beveiligde API gebruiken zonder betaling. Bij de betaalintegratie wordt dit vervangen door `active` met `access_starts_at` en `access_ends_at`.

## Beveiligingsmodel

- De browser stuurt een kortlevend Clerk-sessietoken als Bearer-token.
- Iedere API-route verifieert de tokenhandtekening en toegestane website-origin.
- De server gebruikt uitsluitend `sub` uit het geverifieerde token als gebruikers-ID.
- Databasevragen worden geparametriseerd uitgevoerd.
- Voortgang en resultaten kunnen uitsluitend door de ingelogde eigenaar worden gelezen en geschreven.
- Les- en examendata worden pas als volledig beschermd beschouwd nadat de data naar de `protected_*`-tabellen is gemigreerd en de statische fallback uit `learn5.html` is verwijderd.

## Controle na deployment

1. Log in op `https://www.mursaltheorie.nl`.
2. Open `/api/me` met een geldige Bearer-token; zonder token moet deze `401` geven.
3. Rond een les af en controleer `lesson_progress`.
4. Rond een examen af en controleer `exam_results`.
5. Open `/api/content?resource=lessons` zonder token; deze moet `401` geven.
