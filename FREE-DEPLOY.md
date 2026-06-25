# حِفْظِي — 100% Free Distribution (no Apple fee, no store)

Native iOS via the App Store/TestFlight **always** costs $99/yr (Apple's rule). The free way to put
حِفْظِي on **iPhone and Android** is to host the web app and let users **"Add to Home Screen"** — it
then runs full-screen like a real app, with the حِفْظِي icon, for free.

The app is already PWA-ready (manifest, icons, iOS meta tags, relative asset paths).

---

## Option 1 — Netlify Drop (fastest, zero config)
1. On Windows run: `npm run build` (creates the `dist` folder).
2. Go to **https://app.netlify.com/drop**.
3. **Drag the `dist` folder** onto the page.
4. You get a free URL like `https://hifdhi.netlify.app`. Done.

(Optional: sign up free → "Site settings → Change site name" for a nicer URL, or connect the GitHub
repo so it redeploys automatically on every push.)

---

## Option 2 — GitHub Pages (free, auto-deploys from your repo)
A workflow is already included at `.github/workflows/deploy-pages.yml`.

1. Push the repo to GitHub (see "Fixing the git push" below).
2. On GitHub: **Repo → Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Add the Supabase keys: **Settings → Secrets and variables → Actions → New repository secret**:
   - `VITE_SUPABASE_URL` = `https://lnevazvhcufqlkhmfpni.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_O6BUPvEkI4rVXyVuLRG75A_1xIU41Jj`
4. Every push to `main` builds and publishes to `https://mrmon3ime.github.io/hifdhi/`.

(Other free hosts that also work with zero config: **Vercel**, **Cloudflare Pages**.)

---

## How users install it (free, both platforms)

**iPhone / iPad (Safari):**
1. Open the site URL in **Safari**.
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. The حِفْظِي icon appears; it opens full-screen like an app.

**Android (Chrome):**
1. Open the URL in **Chrome**.
2. Tap **⋮ → Install app / Add to Home screen** (or accept the install prompt).

> No Apple account, no Google Play, no fees, no review. Updates are instant — you just redeploy and
> users get the new version next time they open it.

---

## Comparison

| Route | Cost | Works on | Notes |
|------|------|----------|-------|
| **PWA (Add to Home Screen)** | **Free** | iPhone + Android + desktop | Recommended free option |
| Android APK | Free | Android only | Already built: `android/app/build/outputs/apk/debug/app-debug.apk` |
| iOS via Bitrise/App Store | **$99/yr (Apple)** | iPhone | Native, store listing, TestFlight — see `BITRISE-IOS.md` |

---

## Fixing the git push (`src refspec main` / `Repository not found`)
1. **Create the empty repo on GitHub first:** github.com → **New repository** → name it `hifdhi`
   (owner: MrMon3ime) → **Do NOT** add a README → **Create repository**.
2. Back in your project (branch is already renamed to `main`):
   ```bash
   git push -u origin main
   ```
3. If it asks to sign in, a browser window opens (Git Credential Manager) — sign in to GitHub. If not,
   create a **Personal Access Token** (GitHub → Settings → Developer settings → Tokens) and use it as
   the password when prompted.

> "Repository not found" almost always means the repo wasn't created on GitHub yet, or you're signed
> into the wrong GitHub account.

---

### Note on the publishable key
The `VITE_SUPABASE_PUBLISHABLE_KEY` is meant to be public (it ships in the app/PWA). Make sure
**Row Level Security (RLS)** is enabled on your Supabase tables so the public key can't be misused.
