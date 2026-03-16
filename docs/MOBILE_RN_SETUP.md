# React Native App Setup (MargWatch Mobile)

Step-by-step setup for `apps/mobile-rn`: dependencies, native Android/iOS, Firebase (FCM), and API URL. Steps that need **your action** or **what to give back** are clearly marked.

---

## What’s Already Done in the Repo

- **Step 5 — Android package name:** `applicationId` is set to `com.margwatch.mobile` in `android/app/build.gradle`.
- **Step 6 — App name:** `android/app/src/main/res/values/strings.xml` has `app_name` = `MargWatch`.
- **Step 10 — Firebase in Gradle:**  
  - `android/build.gradle`: `classpath 'com.google.gms:google-services:4.4.0'` is present.  
  - `android/app/build.gradle`: `apply plugin: 'com.google.gms.google-services'` is at the bottom.
- **Step 12 — FCM token log:** In `App.tsx`, `FcmTokenLogger` logs the FCM token to the Metro console on startup (`FCM TOKEN: xxxx`).
- **Step 13 — API URL:** `src/config/apiConfig.ts` uses `process.env.API_BASE_URL || 'http://localhost:5000'`. For a **physical device**, you must point this to your computer’s IP (see below).

---

## Steps You Run Locally

### Step 3 — Install React Native dependencies

```bash
cd apps/mobile-rn
npm install
```

If install fails:

```bash
npm install --legacy-peer-deps
```

---

### Step 4 — Native Android/iOS (only if missing)

The repo already has `android/` and `ios/`. If you need to regenerate them (e.g. after upgrading React Native):

```bash
cd apps/mobile-rn
npx react-native init TempNative --template react-native-template-typescript
# Wait until finished.
# Then copy:
#   TempNative/android  →  apps/mobile-rn/android
#   TempNative/ios       →  apps/mobile-rn/ios
rm -rf TempNative
```

On Windows (PowerShell): use `Remove-Item -Recurse -Force TempNative` instead of `rm -rf TempNative`.

---

### Step 7 — Connect Pixel 7 (or other device)

1. On the phone: **Settings → Developer options → USB debugging** (enable).
2. Connect the device via USB.
3. In a terminal, run:
   ```bash
   adb devices
   ```
   You should see your device (e.g. “Pixel 7”).
4. If the device is not listed: open **Android Studio → Device Manager** and confirm the device/driver.

---

### Step 8 — Build and run the app

```bash
cd apps/mobile-rn
npx react-native run-android
```

This starts Metro, builds the Android app, and installs the APK on the connected device. The first build can take 5–10 minutes.

---

### Step 9 — Firebase (FCM) setup

1. Open [Firebase Console](https://console.firebase.google.com).
2. Create or select project **MargWatch**.
3. **Add app → Android**.
4. **Android package name:** `com.margwatch.mobile` (must match `applicationId` in `android/app/build.gradle`).
5. Download **google-services.json**.
6. Put it at:
   ```
   apps/mobile-rn/android/app/google-services.json
   ```

**If you want the assistant to wire things for you:**  
- Either paste the **contents** of `google-services.json` here (we can write the file into the repo), or  
- Confirm that you’ve placed the file at `apps/mobile-rn/android/app/google-services.json` and we’ll assume it’s there for later steps.

---

### Step 11 — iOS Pods (optional)

If you will run on iOS:

```bash
cd apps/mobile-rn
npx pod-install
```

(Skip if you only use Android.)

---

### Step 13 — Set API URL for physical device

The phone cannot use `localhost`; it must use your computer’s IP.

1. Find your machine’s IP:
   - **Windows:** `ipconfig` → look for “IPv4 Address” (e.g. `192.168.1.7`).
   - **Mac/Linux:** `ifconfig` or `ip addr`.
2. Either:
   - **Option A:** Set env when starting Metro:  
     `API_BASE_URL=http://192.168.1.7:5000 npx react-native start`  
     (replace with your IP and ensure the API is listening on that interface).
   - **Option B:** Edit `apps/mobile-rn/src/config/apiConfig.ts` and replace the default:
     ```ts
     baseURL: process.env.API_BASE_URL || 'http://192.168.1.7:5000',
     ```
     (use your actual IP).

**If you want the assistant to set it:**  
Tell us your computer IP (e.g. “use 192.168.1.7”) and we’ll put it in `apiConfig.ts` as the default.

---

### Step 14 — Test login

1. Start the API (see `docs/RUN_WITHOUT_DOCKER.md`): from repo root, `cd apps/api && npm run dev`.
2. Open the app on the device/emulator.
3. Log in with a test account (same credentials as your backend/seed data).  
   The backend will return a JWT and the app will use it.

---

### Step 15 — Verify notifications

From your computer (API must be running):

```bash
curl -X POST http://localhost:5000/test-fcm -H "Content-Type: application/json" -d "{\"email\":\"user@margwatch.com\"}"
```

Use an email that exists in your DB and has an FCM token registered. The device should receive a push notification.

---

## Summary: what to give back

| Step | Your action | What to provide (if you want the assistant to do it) |
|------|-------------|--------------------------------------------------------|
| 9 – Firebase | Add Android app, download `google-services.json` | Paste contents of `google-services.json` or confirm path `apps/mobile-rn/android/app/google-services.json` |
| 13 – API URL | Use your computer IP for device testing | Your computer IP (e.g. `192.168.1.7`) so we can set default in `apiConfig.ts` |

After you provide the above (or do them yourself), you can run **Step 8** and **Step 14–15** to build, run, test login, and verify FCM.
