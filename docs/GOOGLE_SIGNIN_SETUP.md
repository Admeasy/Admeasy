# Google Sign-In — Admeasy (Capacitor + MERN)

Native **Android / iOS** uses **`@capawesome/capacitor-google-sign-in`** (Credential Manager on Android, Google Sign-In SDK on iOS).  
**Web** keeps the existing **Passport** redirect: `GET /api/users/auth/google`.

ID tokens are verified on the server with **`google-auth-library`** — never trust client-only claims for authorization.

---

## 1) Google Cloud Console

1. Create or open your project: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.

2. **Web application** OAuth client  
   - Used as **`GOOGLE_CLIENT_ID`** (server) and hardcoded in **`Client/src/auth/googleSignIn.ts`** as `GOOGLE_WEB_CLIENT_ID` (public; not a secret).  
   - Authorized JavaScript origins: `https://admeasy.in`, `http://localhost:5173` (dev).  
   - Authorized redirect URIs: `https://admeasy.in/api/users/auth/google/callback`, `http://localhost:5000/api/users/auth/google/callback` (if dev backend on 5000).

3. **Android** OAuth client  
   - Package name: `in.admeasy.app`  
   - SHA-1: debug keystore + **release** keystore (Play uploads).

4. **iOS** OAuth client (when you add `npx cap add ios`)  
   - Bundle ID matching Xcode.  
   - Use the **iOS client ID** in **`Info.plist`** as `GIDClientID` (see Capawesome docs).  
   - Add reversed client ID as URL scheme.

5. OAuth consent screen: publish / test users as required.

---

## 2) Environment variables

**Server `Server/.env`**

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```

**Client:** the Web client ID is **hardcoded** in `src/auth/googleSignIn.ts` so it matches the server.  
(You can still override via fork/env later if needed.)

---

## 3) Install (already in repo)

```bash
cd Client
npm install @capawesome/capacitor-google-sign-in
npx cap sync android   # and ios when applicable
```

---

## 4) Capacitor config

`@capawesome/capacitor-google-sign-in` needs **no** `capacitor.config` plugin block — client ID is passed in **`GoogleSignIn.initialize({ clientId })`** in `src/auth/googleSignIn.ts`.

---

## 5) Android

- **Credential Manager** + **Play Services** are pulled in by the plugin (`android/build` in `node_modules/@capawesome/capacitor-google-sign-in`).  
- `MainActivity` does **not** need manual plugin registration.  
- `AndroidManifest.xml`: `MainActivity` should stay **`singleTask`** (already set) so OAuth return doesn’t spawn duplicate activities.

Optional `variables.gradle` overrides (defaults usually fine):

```gradle
ext {
    androidxCredentialsVersion = '1.5.0'
    googleIdVersion = '1.1.1'
    playServicesAuthVersion = '21.5.0'
}
```

---

## 6) iOS (when project exists)

In `ios/App/App/Info.plist`:

- `GIDClientID` = **iOS** client ID from Google Cloud.  
- `CFBundleURLTypes` → URL scheme: `com.googleusercontent.apps.<NUMERIC_PART>` (reversed client id form from Google).

Then `npx cap sync ios` and open Xcode.

---

## 7) Frontend entry points

| Platform | UX | Code |
|----------|----|------|
| Android / iOS | Native account sheet | `runCapacitorGoogleSignIn()` in `src/auth/googleSignIn.ts` |
| Web | Redirect to Passport | `<a href={WEB_GOOGLE_OAUTH_PATH}>` → `/api/users/auth/google` |

---

## 8) Backend

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/google` | **Preferred** — body `{ "idToken": "..." }`, sets JWT cookies |
| `POST` | `/api/users/auth/google/native` | Same handler (legacy path) |
| `GET` | `/api/users/auth/google` | Start web OAuth |
| `GET` | `/api/users/auth/google/callback` | Passport callback |

Implementation: `Server/controllers/googleIdTokenAuthController.js`.

---

## 9) Security & privacy (edtech)

- Verify **every** `idToken` with `OAuth2Client.verifyIdToken` and audience = `GOOGLE_CLIENT_ID`.  
- Use **HTTPS** in production; cookies: `httpOnly`, `secure`, `sameSite` as you already set in `utils/auth.js`.  
- Do not log raw tokens.  
- Document data use in your privacy policy (Google profile/email for account creation).

---

## 10) Testing checklist

- [ ] **Web**: Login → Continue with Google → redirect → lands logged in.  
- [ ] **Android debug**: SHA-1 in Cloud Console → native sheet → `POST /api/auth/google` 200 → home / onboarding.  
- [ ] **Android release**: Release SHA-1 registered → internal track / Play install.  
- [ ] **iOS**: After `Info.plist` + URL scheme → TestFlight.  
- [ ] Revoked Google account / wrong client ID → friendly toast, no crash.  
- [ ] Server `GOOGLE_CLIENT_ID` missing → 503 JSON.

---

## Alternative plugin

**`@capgo/capacitor-social-login`** — actively maintained; similar flow (native providers + token to backend). Swap client calls only; keep the same `/api/auth/google` contract.
