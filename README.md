# ড্রিম অ্যাপার্টমেন্ট — ফান্ড ট্র্যাকার

A Bengali fund tracker (deposits, expenses, suppliers, loans, shareholders)
for a building/apartment project, built as a lightweight React app. It
requires email + password login, supports self-signup, and stores each
account's data in Firebase (Firestore), so it works from any device and
stays in sync.

- Each account has its **own private data** (separate ledger per user).
- **Anyone can sign up**, but only gets access after: (1) verifying their
  email (Firebase sends the link automatically) and (2) an admin approving
  their request — either from the Firebase Console, or right inside the
  app via the 🛡️ admin panel. See "Approving new users" below.
- Built with **Vite + React** (no Next.js, no server) — a static site once
  built, so it deploys to any free static host. The build step just bundles
  the app; there's no backend to run.

## 1. Create a free Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   click **Add project**. Name it anything (e.g. `dream-apartment`). You can
   skip Google Analytics.
2. The default **Spark plan** (free) is enough for this app.

## 2. Turn on Email/Password login

1. In the Firebase Console, open **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.

## 3. Create the Firestore database

1. Open **Build → Firestore Database → Create database**.
2. Choose any region close to your users, start in **production mode**
   (the security rules in this repo will control access).

## 4. Get your Web App config

1. In Project settings (gear icon) → **Your apps** → click the `</>` (Web)
   icon → register an app (any nickname).
2. Firebase shows a `firebaseConfig` object. Copy it.
3. Open `webapp/src/firebase.js`, find `FIREBASE_CONFIG` near the top, and
   paste your real values in place of the `YOUR_...` placeholders:

   ```js
   const FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "dream-apartment-xxxx.firebaseapp.com",
     projectId: "dream-apartment-xxxx",
     storageBucket: "dream-apartment-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

   This config is not a secret — anyone can see it in the page source. The
   actual data is protected by Firestore Security Rules + the allowlist
   below, not by hiding this object.

## 5. Add allowed users (approve who can actually see data)

Only emails listed in the `allowlist` collection can access the app's
data — this is the final gate, regardless of how someone signed up.

1. In Firestore Database, click **Start collection**.
2. Collection ID: `allowlist`
3. Document ID: the person's email address, **all lowercase**
   (e.g. `rahim@example.com`) — the ID itself is what matters, the document
   can have any single field, e.g. `allowed: true`.
4. Repeat for every person you want to allow (yourself included, to start).

To remove someone's access later, just delete their document from the
`allowlist` collection — their existing account stops working immediately
since every read/write is checked against this list.

### Approving new users (self-signup flow)

Anyone can open the app and create an account — you don't have to know
their email in advance. Here's what happens and what you need to do:

1. They sign up and Firebase automatically emails them a verification link.
2. Once they click it and return to the app, they land on a "waiting for
   approval" screen, and a request appears in a new `pending` collection in
   Firestore (document ID = their user ID, with their email as a field).
3. **To approve someone**: open Firestore Database → `pending` collection,
   find their request, note their email, then add that email to the
   `allowlist` collection exactly as in step 4 above. You can then delete
   the `pending` document if you want to tidy up (not required).
4. They click "আবার চেক করুন" (check again) on their waiting screen (or just
   reload/re-log in) and get straight into the dashboard.

Accounts you already approved before this flow existed keep working exactly
as before — this only adds a queue for *new* sign-ups, it doesn't require
existing users to verify their email.

### Making yourself an admin (in-app approval panel)

An admin can approve/reject signup requests, manage the allowlist, and
add/remove other admins right inside the app via the 🛡️ button in the
header (only visible to admins) — no Firestore Console needed for any of
that. Admins also get full app access automatically, even without a
separate allowlist entry.

**The one Console step you can't skip**: the very first admin has to be
created manually, once — otherwise anyone could grant themselves admin
from inside the app, which would defeat the point of having admins at all.
Every system with permission levels has this same bootstrapping step
somewhere; here it's just one Firestore document:

1. In Firestore Database, click **Start collection**.
2. Collection ID: `admins`
3. Document ID: your email, all lowercase (same format as `allowlist`).
   Any single field works, e.g. `admin: true`.
4. Log out and back into the app with that email — the 🛡️ button appears.

After that, you never need the Console for admin management again: open
🛡️ → **অ্যাডমিন তালিকা** (admin list) → type an email → **+ যোগ করুন** to
add another admin, or tap 🗑 next to one to remove them (you can't remove
the last remaining admin, to avoid locking everyone out).

## 6. Deploy the security rules

Install the Firebase CLI once (needs [Node.js](https://nodejs.org/)):

```bash
npm install -g firebase-tools
firebase login
```

From the project folder:

```bash
firebase use --add        # pick the project you created in step 1
firebase deploy --only firestore:rules
```

## 7. Build the app

The app is a React project (`webapp/`) that compiles down to plain static
files. Install [Node.js](https://nodejs.org/) once, then:

```bash
cd webapp
npm install
npm run build
```

This produces `webapp/dist/` — a folder of plain HTML/CSS/JS you can deploy
anywhere. Re-run `npm run build` any time you (or I) change the code.

## 8. Deploy the app for free

### Option A — Firebase Hosting (simplest, since Auth + Firestore are
already on Firebase)

```bash
firebase deploy --only hosting
```

(`firebase.json` already points at `webapp/dist`.) The CLI prints a live
URL like `https://dream-apartment-xxxx.web.app`.

### Option B — Netlify (no local Node.js needed)

Connect this GitHub repo in the Netlify dashboard and set:

- **Base directory**: `webapp`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

Netlify runs the build for you in the cloud on every push — you don't need
Node.js installed locally with this option.

### Other free static hosts

**Vercel** and **Cloudflare Pages** work the same way — point them at the
`webapp` directory with build command `npm run build` and output directory
`dist`. Whichever host you use, still complete steps 1–6 above first
(Firebase project, Auth, Firestore, allowlist, rules) — hosting only serves
the built files.

## How it works

- `webapp/` is a Vite + React app. `webapp/src/App.jsx` is the entry point;
  screens live under `webapp/src/components/`.
- On load it shows a login/signup screen. After a successful login, it
  checks Firestore access (which enforces the allowlist) before showing
  the app. Not allowlisted yet? It shows "verify your email" (if not
  verified) or "waiting for approval" (if verified but not yet allowlisted)
  instead of the dashboard — see "Approving new users" above.
- All data (shareholders, deposits, expenses, suppliers, loans) is stored
  in one Firestore document per account: `users/{uid}/app/state`. It syncs
  in real time across that user's devices and works offline (Firestore's
  built-in offline cache), syncing again once back online.
- The 👤 button in the header has Logout, change password, and a manual
  JSON backup download/restore (in addition to the automatic cloud sync).
  The 🛡️ button (admins only) approves/rejects signups and manages access.
- The PDF-generation libraries (html2canvas, jsPDF) only load when you
  actually print/export a report, not on every page visit, to keep the
  initial load light.

## Local development

```bash
cd webapp
npm install
npm run dev
# open the URL it prints (usually http://localhost:5173)
```

If `FIREBASE_CONFIG` still has the `YOUR_...` placeholders, the app shows a
"Firebase সেটআপ প্রয়োজন" (setup required) screen with the same steps as
above instead of crashing.
