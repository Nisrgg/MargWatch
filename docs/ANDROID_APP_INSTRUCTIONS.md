# Run the Android App Manually (MargWatch React Native)

Use these steps to run the React Native app on your Android device (e.g. Pixel 7) **without Docker**. The API base URL is already set to **http://172.25.229.200:5000**.

---

## 1. Go to the project

```bash
cd apps/mobile-rn
```

---

## 2. Install dependencies

```bash
npm install
```

If that fails, run:

```bash
npm install --legacy-peer-deps
```

---

## 3. Ensure the Android folder exists

The repo already includes an `android/` folder. If for any reason it is missing:

- Create a temporary React Native project:
  ```bash
  npx react-native init TempNative --template react-native-template-typescript
  ```
- Wait until it finishes.
- Copy `TempNative/android` into `apps/mobile-rn/`.
- Remove the temp project:
  ```bash
  rm -rf TempNative
  ```
  (On Windows: `Remove-Item -Recurse -Force TempNative`.)

---

## 4. Verify package name

Open `apps/mobile-rn/android/app/build.gradle` and confirm:

- `applicationId` is **`com.margwatch.mobile`**

---

## 5. Ensure Firebase file exists

You must have:

- **Path:** `apps/mobile-rn/android/app/google-services.json`

If you have not set up Firebase yet:

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Create/select project **MargWatch**.
3. Add an Android app with package name **`com.margwatch.mobile`**.
4. Download `google-services.json` and place it at `apps/mobile-rn/android/app/google-services.json`.

---

## 6. Verify API base URL

Open `apps/mobile-rn/src/config/apiConfig.ts`.

The default base URL should be:

- **`http://172.25.229.200:5000`**

So the app will call the API at that address. Change it only if your machine’s IP is different.

---

## 7. Connect your Android device

1. On the phone: **Settings → Developer options → USB debugging** (enable).
2. Connect the device via USB.
3. In a terminal, run:
   ```bash
   adb devices
   ```
   Your Pixel (or other device) should appear in the list.
4. If it does not: open **Android Studio → Device Manager** and fix drivers/connection.

---

## 8. Build and install the app

From the repo root or from `apps/mobile-rn`:

```bash
cd apps/mobile-rn
npx react-native run-android
```

This will:

- Start the Metro bundler (if not already running).
- Build the Android app with Gradle.
- Install the APK on the connected device.

The **first build can take several minutes** (often 5–10).

---

## Summary checklist

- [ ] `cd apps/mobile-rn`
- [ ] `npm install` (or `npm install --legacy-peer-deps` if needed)
- [ ] `android/` folder present
- [ ] `applicationId` = `com.margwatch.mobile` in `android/app/build.gradle`
- [ ] `google-services.json` at `android/app/google-services.json`
- [ ] API URL in `src/config/apiConfig.ts` = `http://172.25.229.200:5000`
- [ ] Device connected and visible in `adb devices`
- [ ] `npx react-native run-android` (wait for first build to finish)

Ensure the **API server is running** (e.g. `cd apps/api && npm run dev`) so the app can log in and load data.
