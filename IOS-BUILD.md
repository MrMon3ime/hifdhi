# Building حِفْظِي (Hifdhi) for iPhone / iPad

The web build and the Capacitor **iOS project are already prepared** in the `ios/` folder
(app name: **حِفْظِي**, bundle id: `com.hifdhi.app`).

> ⚠️ **iOS apps can only be built on macOS with Xcode.** Apple does not allow building/signing
> iOS apps on Windows or Linux. You have three options below.

---

## Option A — On a Mac you own / borrow (recommended)

### 1. Install the tools (once)
- **Xcode** from the Mac App Store (large download).
- **Node.js LTS**: https://nodejs.org
- **CocoaPods**: open Terminal and run
  ```bash
  sudo gem install cocoapods
  ```
- An **Apple ID** (free works for testing on your own device; a paid **Apple Developer
  account – $99/yr** is required to publish to the App Store or share via TestFlight).

### 2. Get the project onto the Mac
Copy the whole `CORAN APP` folder to the Mac (USB, cloud drive, or `git clone` if it's on GitHub).
Then in Terminal:
```bash
cd "CORAN APP"
npm install
```

### 3. Add your Supabase keys
Create a file named `.env.local` in the project root (same as on Windows):
```
VITE_SUPABASE_URL=https://lnevazvhcufqlkhmfpni.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_O6BUPvEkI4rVXyVuLRG75A_1xIU41Jj
```

### 4. Build the web app and sync iOS
```bash
npm run build
npx cap sync ios
cd ios/App
pod install
cd ../..
```

### 5. Open in Xcode
```bash
npx cap open ios
```
(or open `ios/App/App.xcworkspace` manually — **the .xcworkspace, not the .xcodeproj**).

### 6. Set signing
In Xcode: select the **App** target → **Signing & Capabilities** →
- Tick **Automatically manage signing**
- Choose your **Team** (your Apple ID / Developer account)
- Bundle Identifier is already `com.hifdhi.app` (change it if it's taken).

### 7. Run on a device or simulator
- Pick an iPhone simulator (or plug in a real iPhone and select it) → press **▶ Run**.
- First run on a real device: on the iPhone go to **Settings → General → VPN & Device
  Management** and trust your developer certificate.

### 8. Distribute (when ready)
- **TestFlight / App Store:** Xcode → **Product → Archive** → **Distribute App** → App Store Connect.
- Requires the paid Apple Developer account and an app record in App Store Connect.

---

## Option B — No Mac: cloud build service
Use a CI that provides macOS runners (you still need an Apple Developer account to install on a real
device or publish):
- **Codemagic** (codemagic.io) — has a Capacitor/Ionic template, free tier.
- **Ionic Appflow** — native Capacitor cloud builds.
- **GitHub Actions** with a `macos-latest` runner (free minutes for public repos).

Typical CI steps: `npm ci` → `npm run build` → `npx cap sync ios` → `pod install` →
`xcodebuild ... archive` with your signing certificate/profile uploaded as secrets.

---

## Option C — No Mac, just want to test quickly
Rent a Mac by the hour: **MacinCloud**, **MacStadium**, or an AWS EC2 **mac** instance, then follow
Option A inside that remote Mac.

---

## App icon & splash screen (optional polish)
To generate all iOS icon/splash sizes from a single image, on the Mac run:
```bash
npm i -D @capacitor/assets
# put a 1024x1024 icon at: resources/icon.png  (and optional resources/splash.png)
npx capacitor-assets generate --ios
```

## Re-syncing after code changes
Any time you change the app code, repeat:
```bash
npm run build && npx cap sync ios
```
then build again in Xcode.

---

### Quick reference
| Item | Value |
|------|-------|
| App name | حِفْظِي |
| Bundle ID | `com.hifdhi.app` |
| Min iOS | as set by Capacitor 8 (iOS 14+) |
| Workspace | `ios/App/App.xcworkspace` |
