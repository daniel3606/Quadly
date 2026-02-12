# Quadly Mobile — Release Status

This document summarizes the current state of the Quadly mobile app and what is missing or recommended before publishing to the App Store and Google Play.

**Last updated:** February 2025

---

## 1. Current state (what’s in place)

### App identity & config
| Item | Status | Notes |
|------|--------|--------|
| App name | Done | **Quadly** (CFBundleDisplayName) |
| Version | Set | **0.1.0** (CFBundleShortVersionString) |
| Build number | Set | **1** (CFBundleVersion) |
| iOS bundle ID | Done | `com.quadly.app` |
| Android package | Done | `com.quadly.app` |
| URL scheme | Done | `quadly` (OAuth / deep links) |
| Orientation | Done | Portrait (iPad: portrait + landscape) |
| Min iOS | Done | 12.0 |

### Assets & UI
| Item | Status | Notes |
|------|--------|--------|
| App icon | Done | `assets/QuadlyIcon.jpg` |
| Splash screen | Done | Same asset, bg `#00274C` |
| Adaptive icon (Android) | Done | Same foreground, same background color |
| Favicon (web) | Done | Same asset |

### Permissions & privacy
| Item | Status | Notes |
|------|--------|--------|
| Camera | Done | NSCameraUsageDescription |
| Photo library | Done | NSPhotoLibraryUsageDescription (listings) |
| Face ID | Done | NSFaceIDUsageDescription |
| Microphone | Done | NSMicrophoneUsageDescription |
| Privacy manifest | Done | `ios/Quadly/PrivacyInfo.xcprivacy` |

### Legal & support (in-app)
| Item | Status | Notes |
|------|--------|--------|
| Privacy Policy link | Done | Settings → https://quadly.org/privacy |
| Terms of Service link | Done | Settings → https://quadly.org/terms |

### Backend & services
| Item | Status | Notes |
|------|--------|--------|
| Supabase | Done | URL + anon key in `app.json` → `expo.extra` |
| Auth (OAuth / deep link) | Done | Scheme + callback handling |
| Google Mobile Ads | Done | AdMob app IDs in app.json (iOS + Android) |
| Image picker | Done | expo-image-picker with photos permission |

### Features (from codebase)
- Auth: login (incl. university selection), callback, session handling
- Home: hot posts, pinned boards, schedule preview
- Community: boards, posts, comments, likes, views, anonymous posts, report, coffee chat
- Marketplace: listings, create listing, conversations, messages
- Classes: course list, reviews, schedule
- Schedule: terms, calendar-style view
- Profile: edit profile, avatar upload, notification settings
- Settings: links to privacy/terms, notification settings

---

## 2. What’s missing or should be done

### 2.1 Build & submit pipeline
| Task | Priority | Notes |
|------|----------|--------|
| Add **EAS (Expo Application Services)** | High | No `eas.json` in repo. Run `npx eas-cli init` and add build/submit profiles (e.g. `preview`, `production`) for iOS and Android. |
| Or use local builds | Medium | If not using EAS: build with Xcode (iOS) and Android Studio (Android), then submit manually. |

### 2.2 Version & store readiness
| Task | Priority | Notes |
|------|----------|--------|
| Consider first release as **1.0.0** | Low | Current version is 0.1.0; many teams use 1.0.0 for first public release. |
| Bump build number per upload | Required | Each App Store / Play Store upload needs a higher build (e.g. 1, 2, 3…). |

### 2.3 Console and logging (production)
| Task | Priority | Notes |
|------|----------|--------|
| Remove or gate **debug logs** | High | See §3 below. `console.log` in supabase.ts, login, callback, and _layout.tsx should be removed or wrapped in `__DEV__` so they don’t run in production. |
| Keep **error logging** | — | `console.error` for failures is fine; consider later routing to a crash/analytics service. |

### 2.4 Security & compliance
| Task | Priority | Notes |
|------|----------|--------|
| Restrict **NSAllowsArbitraryLoads** | Medium | In `ios/Quadly/Info.plist`, `NSAllowsArbitraryLoads` is `true`. Prefer `false` and allow only needed domains via `NSExceptionDomains` (e.g. Supabase, OAuth, ads) to avoid App Review questions. |
| Avoid committing secrets | — | Supabase anon key in app.json is normal for Expo; ensure no service-role or other secrets are in the repo. |

### 2.5 App Store Connect (Apple)
| Task | Priority | Notes |
|------|----------|--------|
| Apple Developer account | Required | $99/year. |
| Create app in App Store Connect | Required | Bundle ID: `com.quadly.app`. |
| Privacy policy URL | Required | e.g. https://quadly.org/privacy (same as in-app). |
| App description, keywords, category | Required | For store listing. |
| Screenshots | Required | iPhone 6.5", 5.5"; iPad if supporting tablet. |
| Support URL | Required | e.g. https://quadly.org or a contact page. |
| Age rating | Required | Complete questionnaire. |
| App Privacy (nutrition labels) | Required | Declare data collection (auth, posts, messages, etc.) and usage. |
| Signing & capabilities | Required | Configure in Apple Developer + Xcode/EAS (e.g. push if used). |

### 2.6 Google Play Console (Android)
| Task | Priority | Notes |
|------|----------|--------|
| Developer account | Required | One-time fee. |
| Create app | Required | Package: `com.quadly.app`. |
| Store listing | Required | Short/long description, graphics, privacy policy. |
| Content rating | Required | Complete questionnaire. |
| Data safety form | Required | Declare what data is collected and how it’s used. |

### 2.7 Testing before release
| Task | Priority | Notes |
|------|----------|--------|
| Production (or release) build | High | Run a release build and test on real devices. |
| TestFlight (iOS) | High | Upload build and test with a small group before going live. |
| Internal/closed testing (Android) | High | Use Play Console to test with a closed track. |
| Critical flows | High | Sign in, sign out, create post, comment, create listing, chat, schedule, notifications. |

---

## 3. Console / logging audit

These entries should be removed or wrapped in `__DEV__` for production.

### 3.1 Always remove or gate (debug / verbose)
- **`src/lib/supabase.ts`**  
  - `console.log('Supabase URL:', ...)`  
  - `console.log('Supabase Key exists:', ...)`  
- **`app/(auth)/login.tsx`**  
  - Multiple `console.log` for Auth redirect, URL, tokens, OAuth URL, browser result, callback URL.  
- **`app/_layout.tsx`**  
  - `console.log` for deep link URL and “Found tokens…”.  
- **`app/(auth)/callback.tsx`**  
  - Multiple `console.log` for initial URL, params, “Waiting for callback…”, “Setting session…”, “Session established…”, “Exchanging code…”, “Session established via code exchange”.  
- **`src/store/communityStore.ts`**  
  - `console.log('Board already saved, refreshing state...')`  

### 3.2 Optional to keep (warnings / errors)
- **`console.warn`** (e.g. “No Supabase anon key”, “User not authenticated”, callback warnings): Safe to keep or gate with `__DEV__`.  
- **`console.error`** (e.g. “Failed to load post”, “Failed to submit comment”): Fine to keep; consider later sending to an error reporting service.

---

## 4. Quick checklist before first submission

- [ ] EAS configured (`eas.json`) or decision to use local builds only  
- [ ] Debug `console.log` removed or wrapped in `__DEV__`  
- [ ] iOS: Consider restricting `NSAllowsArbitraryLoads` and using `NSExceptionDomains`  
- [ ] Version/build set (e.g. 1.0.0 build 1 for first release)  
- [ ] Production build tested on real iOS and Android devices  
- [ ] TestFlight (iOS) and/or Play internal testing (Android) done  

- [ ] App Store Connect and Play Console store listings filled (description, screenshots, privacy, support URL)  
- [ ] Privacy policy and terms URLs match in-app and store listings  
- [ ] Apple App Privacy and Google Data safety forms completed  

---

## 5. Where things live in the repo

| What | Where |
|------|--------|
| App name, version, bundle IDs, Supabase extra, AdMob IDs | `app.json` |
| iOS permissions, URL scheme, ATS | `ios/Quadly/Info.plist` |
| Privacy manifest (iOS) | `ios/Quadly/PrivacyInfo.xcprivacy` |
| Supabase client (and debug logs) | `src/lib/supabase.ts` |
| Auth deep link and logs | `app/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/callback.tsx` |
| In-app links to privacy/terms | `app/settings.tsx` (e.g. quadly.org/privacy, quadly.org/terms) |

---

**Summary:** The app is feature-complete and store-ready from an identity, permissions, and legal-link perspective. Before publishing, add a build/submit path (EAS or local), clean up debug logging, optionally harden iOS ATS, then complete store listings, privacy forms, and device testing.
