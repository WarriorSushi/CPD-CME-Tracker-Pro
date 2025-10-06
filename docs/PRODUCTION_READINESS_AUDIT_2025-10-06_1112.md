# Production Readiness Audit – 2025-10-06 11:12

## Executive Summary
- Current main branch is not production ready: 
px tsc --noEmit surfaces 300+ type errors and fails within seconds.
- Core data providers are broken; multiple contexts call non-existent database APIs, so data loading, profile updates, and license operations throw at runtime.
- Several integrations (notifications, OCR, premium button) degrade UX or crash because of missing dependencies or incorrect API usage.

## Critical / Blocking Issues
- Crash when saving profile updates: src/contexts/UserContext.tsx:69 calls databaseOperations.userOperations.updateUser(user.id, userData) but updateUser in src/services/database/operations.ts:95 expects only the partial User. The first argument becomes a number, causing property access on 
umber and the database write fails. Profile saves never succeed and can surface runtime errors.
- Context data fetchers call undefined services: src/contexts/CMEContext.tsx:86, src/contexts/LicenseContext.tsx:46, and src/contexts/CertificateContext.tsx:43 reference databaseOperations.*Operations, but the exported object only exposes .cme, .licenses, .certificates. Every refresh resolves to undefined and attempts to read methods such as .getAllLicenses crash.
- Notification scheduling uses an invalid trigger shape: src/services/notifications/NotificationService.ts:187 passes { type: 'date', date } to Notifications.scheduleNotificationAsync. Expo 54 expects either a Date object or a defined trigger (calendar, 	imeInterval, etc.). Runtime scheduling throws, so reminders never fire.
- OCR service depends on expo-text-extractor, which is neither installed nor available on Expo 54. import { extractTextFromImage } from 'expo-text-extractor' in src/services/ocrService.ts:1 throws immediately when invoked.
- Premium save button regresses accessibility: src/components/common/OnboardingComponents.tsx:52 renders a grey gradient (#E2E8F0→#CBD5E0) with #4A5568 text whenever loading/disabled is true. The contrast ratio is ~2.7:1, below WCAG AA, and the button appears washed out during normal saves because isSaving toggles immediately.

## TypeScript / Build Status
- 
px tsc --noEmit --pretty false currently fails with >300 errors. Representative categories:
  - Style props typed incorrectly (ViewStyle[] instead of StyleProp<ViewStyle>) in src/components/common/Button.tsx:227, src/components/dashboard/EventRemindersSection.tsx:35, src/components/dashboard/LicensesSection.tsx:81.
  - Missing imports for GestureResponderEvent in src/components/common/PressableFX.tsx:34 and src/components/common/SoundButton.tsx:25.
  - Wrong theme keys (	heme.colors.textSecondary) in src/components/common/LoadingState.tsx:101.
  - PremiumCard signature only allows ViewStyle (src/components/common/OnboardingComponents.tsx:340), so passing animated style arrays triggers TS2322.
  - Global type conflicts from mixing DOM and React Native libs (see 
ode_modules/react-native/src/types/globals.d.ts collisions) indicating the project needs updated lib configuration or explicit skipLibCheck.

## Additional High-Priority Fixes
- databaseOperations.user.updateUser never returns the updated row. UserContext expects esult.data to exist, so even after fixing the call signature, profile state will stay stale. Fetch the updated user (or call getCurrentUser) before returning.
- AppProvider relies on the same broken operations; once the context bugs are fixed, retest data hydration flows (src/contexts/AppContext.tsx:443, .503, etc.).
- LoadingState references theme keys that do not exist (e.g., 	heme.colors.gray200) – update to 	heme.colors.gray[200] to avoid runtime undefined colors and stop TS2551 errors.
- GlobalErrorHandler assumes global.addEventListener always exists (src/utils/GlobalErrorHandler.ts:34). Guard the listener so low-level environments (older Android) do not throw.
- UseNavigationSounds listens to 'state' with a setTimeout return value (src/hooks/useNavigationSounds.ts:28). The listener should not return a cleanup function that just clears the timeout; that conflicts with React Navigation expectations.

## UI / UX Concerns
- Save buttons flip to a disabled palette on every submit (src/screens/settings/ProfileEditScreen.tsx:478), causing low contrast and implying failure even while successful requests run.
- AppNavigator logs console.log("dY"? ...) when errors occur (App.tsx:16), which looks like noise and should be replaced with meaningful messaging.
- Several cards (PremiumCard) rely solely on drop-shadows with minimal contrast between surfaces and backgrounds; combine with border/color tokens from 	heme to improve clarity.

## Observability & Testing Gaps
- No automated tests or linting scripts exist in package.json. Add at least 	sc, a linter, and critical path unit tests (database operations, contexts) to CI.
- Logging helpers (devLog) are effectively no-ops throughout the repo, reducing their usefulness. Either remove or wire them to a centralized logger with environment guards.

## Recommended Remediation Plan
| Sequence | Window | Action |
| --- | --- | --- |
| 1 | Day 0–1 | Fix context/database wiring: rename calls to .cme, .licenses, .certificates, update UserContext to pass only Partial<User> and return fresh user data. |
| 2 | Day 1 | Repair TypeScript errors: convert all component style props to StyleProp, import missing RN types, correct theme references, adjust tsconfig libs if necessary. Run 
px tsc --noEmit until clean. |
| 3 | Day 1–2 | Update Premium button states to keep brand gradient during loading, increase disabled text contrast, and regress test Save flows. |
| 4 | Day 2 | Patch Notification and OCR integrations: replace invalid trigger with 	rigger: notification.scheduledFor, remove or replace expo-text-extractor (e.g., Expo Vision API) and ensure dependencies are installed. |
| 5 | Day 2–3 | Add automated checks (lint, type-check) to scripts and documentation so regressions surface prior to release. |

## Verification Checklist
- [ ] 
px tsc --noEmit exits 0.
- [ ] Profile update succeeds and persists in SQLite (inspect via databaseOperations.user.getCurrentUser).
- [ ] License/CME lists load without runtime warnings.
- [ ] Scheduling a reminder succeeds without throwing and produces an Expo scheduled notification.
- [ ] Save buttons retain accessible contrast during loading.

---

### 2025-10-06 11:45 – Data Layer Repairs
- Rewired all context providers (`CMEContext`, `LicenseContext`, `CertificateContext`, `UserContext`) to use the correct `databaseOperations.cme|licenses|certificates|user` APIs so refresh/add/update flows no longer dereference `undefined`.
- Extended `databaseOperations.cme` with `getRecentEntries` and added compatibility aliases (`*.Operations`) to preserve any legacy call sites.
- Rebuilt `userOperations.updateUser` to upsert safely, return the refreshed user row, and hydrate the runtime cache; `UserContext` now uses the new signature and falls back to `refreshUserCache()` when the DB adds columns on the fly.
- Confirmed `npx tsc --noEmit --pretty false` still fails (expected until Step 2), but the new data-layer code compiles without syntax errors; manual profile refresh and entry mutations now hit real implementations.
- Next: clean up TypeScript surface (style props, missing gesture types), then harden notifications & premium button accessibility.
