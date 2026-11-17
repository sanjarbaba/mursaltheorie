# Android preparation — 17 November 2026

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
- Identify the correct Google Cloud project and configure Google sign-in/consent.
- Enable Google in the existing production Clerk instance. Configure native Android application nl.mursaltheorie.app and signing SHA-256. Register matching OAuth SHA-1 for each signing certificate (preview and Play App Signing).
- Set EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID in the correct EAS environments. Never place client secrets in the app.
- Google Play products, backend purchase verification, account binding, acknowledgement, restore/reconciliation and refunds/RTDN still need implementation. Apple purchases are iOS-only; no Android checkout has been added yet.
- No APK/AAB has been built or installed yet. Physical-device tests and Google sign-in/payment tests remain outstanding.
- Browser automation was unavailable during preparation; no Google Cloud, Clerk or Play Console settings were changed.

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
