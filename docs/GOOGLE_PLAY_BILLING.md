# Android Google Play billing — 18 November 2026

Implementation is on the Android preparation branch. It is NOT deployed or enabled in production.
The installed APK build 1 predates this code. Do not describe it as supporting payments yet.

## Packages
| Play product ID | Entitlement | Languages |
| --- | --- | --- |
| nl.mursaltheorie.course.nl.30d | theory_b_nl_30d | Nederlands |
| nl.mursaltheorie.course.nl.fa.30d | theory_b_nl_fa_30d | Nederlands + Dari/Farsi |
| nl.mursaltheorie.course.nl.ps.30d | theory_b_nl_ps_30d | Nederlands + Pashto |

One-time consumable passes, 30 days, no automatic renewal. Disable multi-quantity purchases.
Create and activate these exact IDs in Play Console. Use the approved current prices; the app displays Play's localized displayPrice and never invents a price.
Dutch is included in both translated packages. The existing course language selector enables NL plus the purchased translation. Pashto never falls back to Dari when Pashto content is absent.

## Server deployment
1. Apply database/migrations/047_google_in_app_purchases.sql to the existing database.
2. Deploy the new Google endpoint/helper, dependency/lockfile and Vercel duration setting against the CURRENT production backend. Do not deploy this old iOS-derived branch wholesale over the live website.
3. Configure a Google service account with only the required Play purchase/order access for package nl.mursaltheorie.app and enable the Android Publisher API.
4. Store GOOGLE_PLAY_SERVICE_ACCOUNT_JSON and a random GOOGLE_PLAY_ACCOUNT_SECRET of at least 32 characters in server environment variables. Do not rotate the account secret without migrating stored mappings. Never place these in EXPO_PUBLIC variables or the mobile bundle.
5. Configure Play real-time developer notifications through Pub/Sub. Use authenticated push to https://www.mursaltheorie.nl/api/v1/google-purchases?resource=notification with a dedicated push service account. Set GOOGLE_PLAY_NOTIFICATION_EMAIL to that service account and GOOGLE_PLAY_NOTIFICATION_AUDIENCE to the exact configured OIDC audience. Verify the Play test notification succeeds.
6. For license testers only, set GOOGLE_PLAY_TEST_USER_IDS to explicit Clerk user IDs. Other accounts cannot turn test payments into access. No general sandbox bypass exists.
7. Set GOOGLE_PLAY_BILLING_ENABLED=true only when migration, credentials, notification delivery and internal testing are ready. The default is disabled and no Android checkout is rendered.

The server verifies the current Google purchase, account mapping, product, quantity, payment state and time. It persists the entitlement before consuming. A repeated callback never creates another pass. A failed consume can retry safely. Pending/cancelled/invalid purchases cannot grant access. Refunds are terminal, including when an old purchased callback arrives afterward.
Tokens are hashed in the database; raw tokens and Google error objects are not logged. A token tombstone remains without an account identifier after account deletion to prevent replay. Restore recovers unfinished Play purchases and reloads existing server access for the same Clerk account, including consumed passes. A different Clerk account cannot take over a purchase just because it uses the same Play account.

## Required live checks
The Play Console account currently shown for xsanjarbaba@gmail.com is at account registration. No Play app/catalog/internal release has been configured in this session. Complete registration (including any identity/organization verification, agreement and payment personally) or switch to an already registered developer account.

Upload a new AAB to internal testing; install through the tester link. The APK already installed is only the previous login test. Check new unpaid account restrictions, all three products/language combinations, pending and declined test payments, successful payment without relogin, connection loss/retry, restart/restore, repeat pass purchase after expiry, account switching, a refund followed by an old callback, and notification authentication/retry. Monitor undelivered Pub/Sub notifications and reconcile/refund any affected orders before launch. End-to-end Play billing and real refunds remain unverified until these steps pass.

## Validation
Run pnpm test at repository root (includes real PostgreSQL-compatible migration tests with PGlite).
From mobile run pnpm typecheck, pnpm test:android and pnpm content:check.
Official references: https://developer.android.com/google/play/billing/security and https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products.

Local result: 15 new Google payment tests pass, including the actual SQL migration and purchase/consume ordering. TypeScript, Android access/language tests, and content validation pass. The full inherited repository suite reports 113/124 passing with 11 existing website test failures. The 101 inherited test/API/top-level website sources were hash-compared with the previous Android commit and are unchanged. These inherited failures must be reviewed before deploying any broader backend/site update. No on-device Google purchase has been tested.
