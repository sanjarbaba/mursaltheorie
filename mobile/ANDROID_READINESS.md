# Android preparation — 18 November 2026

Base: ios-v1-testflight, commit d50bebff211761fc5a6aba9ca106289bdd878320 (iOS build 14).
The existing screens, languages, content and API endpoints remain the source of truth.

## Implemented
- Separate android-preview APK and android-production AAB build profiles.
- Google web/Android OAuth client IDs exposed to the existing Clerk AuthView via Expo config.
- Android-only route and navigation protection: an authenticated account alone cannot open course screens.
- Account-scoped access revalidation on login, foreground and at least once per minute; explicit denials never fall back to cached access.
- Existing unexpired, account-scoped offline lease preserved; other accounts cannot reuse it.
- Access refresh after purchase can unlock the course without signing out and in again.
- Existing iOS purchase implementation and iOS release configuration preserved.

## Not yet configured or verified
- Google Cloud project mursal-theorie exists; finish Google sign-in/consent configuration.
- Enable Google in the existing production Clerk instance. Configure native Android application nl.mursaltheorie.app and signing SHA-256. Register matching OAuth SHA-1 for each signing certificate (preview and Play App Signing).
- Set EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID in the correct EAS environments. Never place client secrets in the app.
- Google Play purchase UI, server verification/account binding, atomic grants, server consumption, retry/restore and authenticated refund notifications are implemented in this branch. See ../docs/GOOGLE_PLAY_BILLING.md. Not deployed or enabled; Play catalog, credentials and end-to-end tests remain outstanding.
- Preview APK build 1 succeeded and the user confirmed installation and login with an existing account. This build predates the Google billing implementation. Google-provider sign-in and Play payment tests remain outstanding.
- Google Cloud project mursal-theorie has been created. support@mursaltheorie.nl is configured as an email alias at Purelymail, with MX/SPF/DKIM/DMARC validated. OAuth configuration still requires registering that email as a Google account (or choosing an eligible existing account/group). Clerk and Play Console settings have not been changed.

## Required end-to-end tests
1. New Google account: only account/purchase screen; no course/deep link/back-button access.
2. Verified payment: same signed-in account gains the correct language package; no second login.
3. Existing paid account signs in with its linked Google identity: retain current access and progress.
4. Cancelled/pending/rejected/replayed payment: no access; no duplicate grant.
5. Sign out and switch Google accounts: no previous user's access, progress or offline course.
6. Expired/refunded access is revoked. Offline reading ends with the existing lease.
7. Lessons, exams, audio, images, Dari/Farsi and Pashto match the iOS version; foreground checks do not interrupt an active exam.

## Build commands
From mobile: pnpm install --frozen-lockfile, pnpm typecheck, pnpm content:check, pnpm test:android.
Then npx eas-cli build --platform android --profile android-preview.
Use android-production only after the above configuration and purchase tests are complete.

## Local validation
TypeScript check passed; 147 traffic signs and 30 road situations validated; five Android access-policy tests passed. A help/contact link uses support@mursaltheorie.nl on Android.

- Play Console currently opens the developer-account registration page for xsanjarbaba@gmail.com. Registration or a switch to an existing developer account is needed before product creation/internal billing testing.
- Both Dari/Farsi and Pashto packages include Dutch. Product mapping tests enforce this.
