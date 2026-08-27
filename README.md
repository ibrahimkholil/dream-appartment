# ড্রিম অ্যাপার্টমেন্ট — ফান্ড ট্র্যাকার

A single-page Bengali fund tracker (deposits, expenses, suppliers, loans,
shareholders) for a building/apartment project. It now requires email +
password login, supports self-signup, and stores each account's data in
Firebase (Firestore), so it works from any device and stays in sync.

- Each account has its **own private data** (separate ledger per user).
- Signup is **invite-only**: only email addresses you add to an allowlist
  can create an account or log in. Anyone else gets a clear "not
  authorized" message.
- 100% static site (`public/index.html`) — no server/backend to run.

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
3. Open `public/index.html`, find `FIREBASE_CONFIG` near the top of the
   `<script>` block, and paste your real values in place of the
   `YOUR_...` placeholders:

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

## 5. Add allowed users (the invite-only allowlist)

Only emails listed here are allowed to sign up or log in — this is what
makes signup "invite-only" instead of open to anyone with the link.

1. In Firestore Database, click **Start collection**.
2. Collection ID: `allowlist`
3. Document ID: the person's email address, **all lowercase**
   (e.g. `rahim@example.com`) — the ID itself is what matters, the document
   can have any single field, e.g. `allowed: true`.
4. Repeat for every person you want to allow (yourself included).

To remove someone's access later, just delete their document from the
`allowlist` collection — their existing account stops working immediately
since every read/write is checked against this list.

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

## 7. Deploy the app for free (Firebase Hosting)

Firebase Hosting's free tier (10 GB storage, 360 MB/day transfer) is more
than enough for this app, and it's the simplest choice since Auth +
Firestore are already on Firebase.

```bash
firebase deploy --only hosting
```

The CLI prints a live URL like `https://dream-apartment-xxxx.web.app` —
that's your app, ready to share with your allowlisted users.

To push a later update, just re-run `firebase deploy --only hosting`.

### Alternative free static hosts

Since `public/index.html` is a plain static file, any of these also work
(Firebase Auth/Firestore keep working from any domain — no changes needed):

- **Netlify** — drag-and-drop the `public` folder in the Netlify dashboard,
  or connect this GitHub repo for auto-deploys.
- **Vercel** — `vercel --prod` from the `public` folder, or import the repo.
- **Cloudflare Pages** — connect the repo, set build output directory to
  `public`.
- **GitHub Pages** — enable Pages on this repo, serve from `/public`.

If you use one of these instead of Firebase Hosting, still complete steps
1–6 above (Firebase project, Auth, Firestore, allowlist, rules) — Firebase
Hosting is only for serving the static file, and is optional.

## How it works

- `public/index.html` is the entire app (HTML/CSS/JS in one file).
- On load it shows a login/signup screen. After a successful login, it
  checks Firestore access (which enforces the allowlist) before showing
  the app.
- All data (shareholders, deposits, expenses, suppliers, loans) is stored
  in one Firestore document per account: `users/{uid}/app/state`. It syncs
  in real time across that user's devices and works offline (Firestore's
  built-in offline cache), syncing again once back online.
- The 👤 button in the header has Logout, change password, and a manual
  JSON backup download/restore (in addition to the automatic cloud sync).

## Local testing

You can open `public/index.html` directly, but browsers block some
features (like Firestore) on `file://` URLs, so serve it over HTTP instead:

```bash
cd public
python3 -m http.server 8080
# open http://localhost:8080
```

If `FIREBASE_CONFIG` still has the `YOUR_...` placeholders, the app shows a
"Firebase সেটআপ প্রয়োজন" (setup required) screen with the same steps as
above instead of crashing.
