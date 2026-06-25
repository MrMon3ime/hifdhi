# حِفْظِي — Hifdhi

نظام إدارة حلقات تحفيظ القرآن الكريم · Qur'an Memorization Circle Management.
React + Vite + Supabase, packaged for Android/iOS with Capacitor and installable as a free PWA.

## 🌍 Live links (free hosting)

| Platform | Link |
|----------|------|
| **GitHub Pages** | https://mrmon3ime.github.io/hifdhi/ |
| **Netlify** | https://hifdhi.netlify.app |

> The links go live once each host is connected (see below). iPhone/Android users open a link and
> **Add to Home Screen** to install حِفْظِي for free — no Apple/Google account needed.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/MrMon3ime/hifdhi)

### Enable GitHub Pages
1. Push the repo to GitHub, then **Settings → Pages → Source: GitHub Actions**.
2. Add repo secrets (**Settings → Secrets and variables → Actions**): `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Every push to `main` deploys via `.github/workflows/deploy-pages.yml` →
   **https://mrmon3ime.github.io/hifdhi/**

### Enable Netlify
1. Click the **Deploy to Netlify** button above (or netlify.com → Add new site → import the repo).
2. Build settings come from `netlify.toml` (`npm run build` → `dist`).
3. Add the two `VITE_SUPABASE_*` variables under **Site settings → Environment variables**.
4. Optional: **Site settings → Change site name → `hifdhi`** → **https://hifdhi.netlify.app**

---

## 📱 Install on a phone (free PWA)
- **iPhone (Safari):** open a link above → **Share → Add to Home Screen**.
- **Android (Chrome):** open a link → **Install app**. Or share the APK directly.

## 📦 Native apps
- **Android APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (built and installable now).
- **iOS:** see [`BITRISE-IOS.md`](BITRISE-IOS.md) (cloud build) or [`IOS-BUILD.md`](IOS-BUILD.md).
  Native iOS distribution requires a paid Apple Developer account ($99/yr) — the **free** iOS route is
  the PWA above. Full details in [`FREE-DEPLOY.md`](FREE-DEPLOY.md).

## 📖 User guides
Bilingual PDFs to send to users: [`user-guide/hifdhi-guide-ar.pdf`](user-guide/hifdhi-guide-ar.pdf) ·
[`user-guide/hifdhi-guide-en.pdf`](user-guide/hifdhi-guide-en.pdf)

---

## 🛠️ Development
```bash
npm install
# create .env.local with:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_PUBLISHABLE_KEY=...
npm run dev      # start dev server
npm run build    # production build → dist/
npx cap sync     # sync web build into android/ and ios/
```

> Keep **Row Level Security** enabled on Supabase tables — the publishable key ships in every web/PWA build.
