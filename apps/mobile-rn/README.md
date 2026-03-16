# MargWatch Mobile (React Native)

React Native app for MargWatch — road issue reporting, work orders, and notifications. Mirrors the Android app architecture; backend, ML service, and admin portal unchanged.

## Prerequisites

- Node 18+
- React Native CLI (no Expo)
- Android Studio / Xcode for native builds
- For Android: JDK 17, Android SDK
- Firebase project with FCM enabled (for push notifications)

## Setup

### 1. Build shared types

From repo root:

```bash
cd packages/shared-types && npm install && npm run build && cd ../..
```

### 2. Install dependencies

```bash
cd apps/mobile-rn
npm install
```

### 3. Native projects

If `android/` and `ios/` are missing, create a new React Native app and copy the native folders:

```bash
# From repo root
npx @react-native-community/cli@latest init TempRN --skip-install --pm npm
cp -r TempRN/android apps/mobile-rn/
cp -r TempRN/ios apps/mobile-rn/
rm -rf TempRN
```

Then run `npm install` again in `apps/mobile-rn`.

### 4. Environment

Create `.env` or set:

- `API_BASE_URL` — e.g. `http://192.168.1.100:5000` for device (use your machine IP when testing on a physical device).

Default without env is `http://localhost:5000`.

### 5. Firebase

Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to the project and link Firebase (see React Native Firebase docs).

## Scripts

- `npm start` — Start Metro bundler
- `npm run android` — Run on Android
- `npm run ios` — Run on iOS

## Architecture

- **API**: `src/api/` — axios client + auth, complaints, work orders, notifications, FCM APIs
- **Auth**: `src/store/AuthContext.tsx` — JWT in AsyncStorage, login/logout/restore
- **Navigation**: `src/navigation/` — Auth stack (Login, Register), Main stack (all screens)
- **State**: React Query for server state; hooks in `src/hooks/`
- **FCM**: Token requested after login and sent to `POST /api/fcm/token`
- **WebSocket**: `src/hooks/useWebSocket.ts` — `ws://<API_HOST>/ws/notifications?token=<JWT>`

Screens are placeholders; implement UI in the same structure.
