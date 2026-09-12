# Staff auth setup (Parslia / The Vedānta)

This site uses **Firebase Authentication** (email/password) and **Cloud Firestore** for per-user activity. Config is client-side for GitHub Pages; protect data with Security Rules.

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Add a project (e.g. `parslia-vedanta` or your kitchen name)
3. Skip Google Analytics if you prefer

## 2. Enable Email/Password sign-in

1. **Build → Authentication → Sign-in method**
2. Enable **Email/Password**
3. Save

## 3. Create Firestore

1. **Build → Firestore Database → Create database**
2. Start in **production mode** (you will paste rules next)
3. Choose a region close to your team (e.g. `europe-west2`)

## 4. Security rules (paste in Firestore → Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /events/{eventId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Publish the rules.

These rules mean **each signed-in staff member can only read/write their own user document and their own `events` subcollection**.

## 5. Register a web app and copy config

1. Project settings → **Your apps** → Web (`</>`)
2. Register app nickname e.g. `parslia-pages`
3. Copy the `firebaseConfig` object fields into:

`js/firebase-config.js`

Fill:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

Leave no required field empty. `window.PARSLIA_FIREBASE_READY` becomes `true` only when required fields are set.

## 6. Authorized domains

In Authentication → Settings → **Authorized domains**, ensure:

- `parslia.net`
- `shyam1-jpg.github.io` (if used)
- `localhost` (for local checks)

## 7. Redeploy

Commit and push the updated `js/firebase-config.js` (with your real config) to `main` so GitHub Pages updates.

Until config is pasted, `auth.html` shows a setup banner and disables submit.

## What gets tracked

After login, gated pages log to `users/{uid}/events`:

- `page_view`
- `video_play` / `video_progress` (25/50/75) / `video_complete`
- `click` (nav + `[data-track]`)
- `form_save` (custom event `parslia:form-save` + localStorage form keys)

Staff can review their own trail on **my-activity.html**.

## Notes

- The Firebase **web API key is not a secret** in the traditional sense; security comes from Auth + Firestore rules.
- Do not commit service account JSON or Admin SDK keys into this public Pages repo.
