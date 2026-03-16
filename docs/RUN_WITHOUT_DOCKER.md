# Running MargWatch Without Docker

Use this guide when you want to run the **API** and **Admin Portal** with Node.js only (no Docker). The **ML service is disabled**; the API uses hardcoded bypass values (e.g. category `OTHER`, model version `"testing"`).

---

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** (local or NeonDB URL in `.env`)
- **Redis** (optional; some features may require it)

---

## Test accounts (after `npx prisma db seed`)

| Role   | Email                  | Password   |
|--------|------------------------|------------|
| Admin  | admin@roadportal.com   | admin123 (or `ADMIN_PASSWORD` env) |
| User   | user@roadportal.com    | user123    |
| Worker 1 | worker1@roadportal.com | worker123  |
| Worker 2 | worker2@roadportal.com | worker123  |

---

## 1. Backend API

From the repository root:

```bash
cd apps/api
cp env.template .env
# Edit .env: set DATABASE_URL, JWT_SECRET, CLOUDINARY_*, FIREBASE_*, etc.

npm install --legacy-peer-deps
npx prisma generate
npm run dev
```

API runs at **http://localhost:5000** (or the port in `.env`).

- **ML service:** Not used. All ML-related responses are bypassed with fixed values (e.g. `"testing"`).

---

## 2. Admin Portal

From the repository root:

```bash
cd apps/admin-portal
npm install
npm run dev
```

Admin portal runs at **http://localhost:3000**.

For **physical device or same-network access**, set in `apps/admin-portal/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://172.25.229.200:5000/api
```

(Replace with your machine IP if different.) When using the admin portal on the **same machine** as the API, `http://localhost:5000/api` is preferred so requests don’t time out.

---

## 3. Database

Run migrations and seed (once) from `apps/api`:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

---

## 4. Optional: Redis

If the API expects Redis (e.g. for sessions or queues), start Redis locally or set `REDIS_URL` in `apps/api/.env` to a cloud instance.

---

## Troubleshooting

### Port already in use (EADDRINUSE) or EPERM on .next / Prisma

If the API says **port 5000 is already in use** or the Admin Portal fails with **EPERM** on `.next\trace`, other Node processes are likely still running.

**1. Find and stop what’s using the ports (Windows)**

In **PowerShell** (or CMD):

```powershell
# See what is using port 5000 (API)
netstat -ano | findstr :5000

# See what is using port 3000 (Admin Portal)
netstat -ano | findstr :3000
```

The last column is the **PID**. Kill it (replace `PID` with the number):

```powershell
taskkill /PID <PID> /F
```

Example: if port 5000 shows PID 12345, run `taskkill /PID 12345 /F`.

**2. In Git Bash (MINGW64)** you can use:

```bash
# List process using port 5000 (Windows)
netstat -ano | grep :5000
# Then: taskkill //PID 12345 //F   (use the PID from the last column)
```

**3. Fix Admin Portal EPERM on `.next`**

Close any terminal where `npm run dev` is running for the admin-portal, then remove the build cache so Next.js can recreate it:

```bash
cd apps/admin-portal
rm -rf .next
npm run dev
```

On Windows CMD: `rmdir /s /q .next` then `npm run dev`.

**4. Fix Prisma EPERM (API)**

Ensure no API (nodemon/node) process is running on 5000, then from `apps/api` run:

```bash
npx prisma generate
npm run dev
```

**5. Admin portal login timeout (Axios 10000ms / 30s exceeded)**

- Ensure the **API is running** (`curl http://localhost:5000/health`).
- If the admin portal runs on the **same machine** as the API, set in `apps/admin-portal/.env.local`:  
  `NEXT_PUBLIC_API_URL=http://localhost:5000/api`  
  so the browser talks to localhost instead of a LAN IP that may be slow or blocked.
- The API client timeout is 30s; if the backend is slow (e.g. cold DB), the request may still time out until the DB responds.

---

## 5. Android app (React Native)

From the repository root. Full steps are in [ANDROID_APP_INSTRUCTIONS.md](./ANDROID_APP_INSTRUCTIONS.md); here are the main commands.

**Install and run (device or emulator):**

```bash
cd apps/mobile-rn
npm install
# If install fails: npm install --legacy-peer-deps
npx react-native run-android
```

**Optional: clean Android build**

```bash
cd apps/mobile-rn/android
./gradlew clean
cd ..
npx react-native run-android
```

**Check device is connected:**

```bash
adb devices
```

**Verify API URL for the app:**  
Edit `apps/mobile-rn/src/config/apiConfig.ts` — use your machine IP (e.g. `http://172.25.229.200:5000`) when testing on a physical device so the phone can reach the API.

**Start Metro separately (if needed):**

```bash
cd apps/mobile-rn
npx react-native start
```

**If build succeeds but install fails: "No connected devices!"**

- The APK built; Gradle could not install because no device/emulator was connected.
- **Physical device:** Connect via USB, enable **USB debugging** (Settings → Developer options), then run `adb devices`. If the device appears, run `npx react-native run-android` again.
- **Emulator:** Start an AVD from Android Studio (Device Manager) or run `emulator -avd <AVD_NAME>` (list with `emulator -list-avds`), wait until it boots, then run `npx react-native run-android`.

**C/C++ warnings during build (`'$' in identifier`):**  
These come from generated code in `react-native-screens` and `react-native-safe-area-context`. They are warnings only and do not cause the build to fail. You can ignore them.

**Metro fails with "Cannot read properties of undefined (reading 'handle')"**

If `npx react-native start` crashes with that error, the project needs a compatible `@react-native-community/cli-server-api` that exports `indexPageMiddleware`. Add to `apps/mobile-rn/package.json` devDependencies and run `npm install`:

- `"@react-native-community/cli": "~16.0.0"`
- `"@react-native-community/cli-server-api": "16.0.3"`

Then run `npx react-native start` again.

**"Unable to load script" / "Make sure you're running Metro" on the device**

The app is installed but cannot load the JavaScript bundle because **Metro** (the dev server) is not running or the device cannot reach it.

1. **Start Metro first** (in a terminal, keep it running):
   ```bash
   cd apps/mobile-rn
   npx react-native start
   ```
   Wait until you see something like "Welcome to Metro" and the server is ready.

2. **Then** either:
   - Run the app again: `npx react-native run-android` (in another terminal), or  
   - Just open the MargWatch app on the device (if it’s already installed).

3. **Physical device only** – if the app still can’t load the bundle, the device may be trying to reach Metro at the wrong host. Do **one** of the following:
   - **Option A (recommended):** Reverse the Metro port so the device’s `localhost:8081` goes to your PC:
     ```bash
     adb reverse tcp:8081 tcp:8081
     ```
     Then reload the app (shake device → Reload, or reopen the app).
   - **Option B:** On the device, open the **React Native dev menu** (shake device or `adb shell input keyevent 82`), go to **Settings** → **Debug server host & port for device**, and set it to **`<YOUR_PC_IP>:8081`** (e.g. `172.25.229.200:8081`). Reload the app.

4. Ensure your **firewall** allows incoming connections on port **8081** from the device (same network).

---

## Summary

| Service        | Command (from repo root)              | URL              |
|----------------|---------------------------------------|------------------|
| API            | `cd apps/api && npm run dev`          | http://localhost:5000 |
| Admin Portal   | `cd apps/admin-portal && npm run dev` | http://localhost:3000 |
| Android app    | `cd apps/mobile-rn && npx react-native run-android` | Metro: http://localhost:8081 |
| ML Service     | **Disabled** (bypass in API)          | —                |
