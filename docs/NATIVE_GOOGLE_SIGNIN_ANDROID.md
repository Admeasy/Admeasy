# Native Google Sign-In (Android, Capacitor)

Auth is your **Node/Passport + JWT cookies** backend — not Firebase Auth. The Android app uses **`@codetrix-studio/capacitor-google-auth`** (native account picker) and exchanges the **Google ID token** at:

`POST /api/users/auth/google/native`  
Body: `{ "idToken": "..." }`  
Response: same shape as `POST /api/users/login` (sets `accessToken` / `refreshToken` cookies).

## What you must configure

1. **Google Cloud Console**
   - **Web application** OAuth client → use its Client ID as:
     - `GOOGLE_CLIENT_ID` (server `.env`, already used by Passport)
     - `VITE_GOOGLE_WEB_CLIENT_ID` (Client `.env` for Vite builds)
     - `plugins.GoogleAuth.serverClientId` in `Client/capacitor.config.json` (must match; run `npx cap sync android` after changing)
   - **Android** OAuth client → package `in.admeasy.app` + **SHA-1** (debug and release keystores).

2. **Client `.env`**
   - `VITE_GOOGLE_WEB_CLIENT_ID=<same Web client ID>.apps.googleusercontent.com`

3. **Capacitor**
   - Replace `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com` in `capacitor.config.json` under `plugins.GoogleAuth.serverClientId`.

4. **`google-services.json` (optional but recommended)**
   - From Firebase (same Google project): place at `Client/android/app/google-services.json`.
   - Root `android/build.gradle` already includes `com.google.gms:google-services`.
   - `app/build.gradle` applies the plugin when the file exists.

5. **Deploy**
   - Ship the new API route with your server so `https://admeasy.in/api/users/auth/google/native` is live before testing the store build.

## Build

```bash
cd Client
npm run build
npx cap sync android
```

## Notes

- **Web** still uses `GET /api/users/auth/google` (redirect flow).
- **Android** uses the native button path only when `Capacitor.getPlatform() === 'android'`.
- Plugin declares peer `@capacitor/core` ^6; this project uses Capacitor 8 — install used `--legacy-peer-deps`. If you hit runtime issues, consider migrating to a maintained plugin (e.g. Capgo social login).
