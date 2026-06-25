# Building حِفْظِي for iOS on Bitrise.io (no Mac needed)

Bitrise runs your build on cloud macOS machines. This project is already prepared:
- Capacitor 8 → **Swift Package Manager** (no CocoaPods).
- Build target: **`ios/App/App.xcodeproj`**, shared scheme **`App`** (already created).
- A ready `bitrise.yml` is in the repo root.

> You still need a paid **Apple Developer account ($99/yr)** to produce an installable/TestFlight
> `.ipa` — code signing is an Apple requirement, not a Bitrise one.

---

## STEP 1 — Put the project on Git (GitHub/GitLab/Bitbucket)
Bitrise builds from a Git repo, so the native `ios/` folder **must be committed**.

```bash
# from the project root on Windows
git add android ios bitrise.yml IOS-BUILD.md BITRISE-IOS.md
git add -A
git commit -m "Add iOS project + Bitrise config"
# create an empty repo on GitHub first, then:
git remote add origin https://github.com/<you>/hifdhi.git
git branch -M main
git push -u origin main
```
`.env.local` stays ignored (good — keys go into Bitrise Secrets instead).

---

## STEP 2 — Apple Developer setup (once)
1. Join the Apple Developer Program: https://developer.apple.com (paid).
2. In **App Store Connect → Users and Access → Integrations → App Store Connect API**, create an
   **API Key** (Role: *App Manager* or *Admin*). Download the **.p8** file and note the
   **Issuer ID** and **Key ID**.
3. Register the app's Bundle ID `com.hifdhi.app` (Certificates, IDs & Profiles → Identifiers).
   *(Automatic signing can also create it for you.)*

---

## STEP 3 — Create the app on Bitrise
1. Sign in at bitrise.io → **Add new app**.
2. Pick your Git provider and the repo you pushed in Step 1, branch `main`.
3. Access: choose the repo, let Bitrise add its SSH key.
4. When it asks to scan, choose **Manual / Other** (we provide our own `bitrise.yml`).
5. Set the **Stack** to a recent **macOS / Xcode** stack (e.g. Xcode 16.x).

---

## STEP 4 — Add the App Store Connect API key to Bitrise
1. Bitrise → **Workspace (or Account) settings → Apple service connection → App Store Connect API**.
2. Upload the **.p8** and enter **Issuer ID** + **Key ID**.
3. In the app's **Workflow editor → Code signing** tab, make sure this connection is selected
   (the `xcode-archive` step uses `automatic_code_signing: api-key`).

This lets Bitrise create/download the signing certificate and provisioning profile automatically.

---

## STEP 5 — Add your Supabase keys as Secrets
Workflow editor → **Secrets** (🔒) tab → add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://lnevazvhcufqlkhmfpni.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_O6BUPvEkI4rVXyVuLRG75A_1xIU41Jj` |

(The build writes these into `.env.local` before `npm run build`.)

---

## STEP 6 — Use the provided workflow
The repo's `bitrise.yml` defines a **`build-ios`** workflow that:
1. clones the repo,
2. `npm ci` → `npm run build` → `npx cap sync ios`,
3. `xcode-archive` (project `ios/App/App.xcodeproj`, scheme `App`, automatic signing),
4. uploads the `.ipa` to the build's **Artifacts**.

In the Workflow editor, open the **yml** tab and confirm it matches the repo, or just keep
"Store Bitrise config in repository (bitrise.yml)" enabled so it uses the file directly.

### Choose what kind of build (env `DISTRIBUTION_METHOD` in `bitrise.yml`)
| Goal | Set DISTRIBUTION_METHOD to |
|------|---------------------------|
| Install on registered test devices | `development` or `ad-hoc` |
| TestFlight / App Store | `app-store` |

For `development`/`ad-hoc`, also register your test iPhone's **UDID** in the Apple portal.

---

## STEP 7 — Run the build
- Bitrise → your app → **Start/Schedule a build** → workflow **`build-ios`** → **Start build**.
- ~10–20 min. When green, open the build → **Artifacts** tab → download **`App.ipa`**.

### Installing the .ipa
- **TestFlight (easiest for users):** set `app-store`, then add the
  `deploy-to-itunesconnect-application-loader` step (commented in `bitrise.yml`) or upload the
  `.ipa` to App Store Connect → TestFlight, and invite testers by email.
- **Ad-hoc:** install the `.ipa` on registered devices via Apple Configurator / a service like
  Diawi, or Bitrise's own "Public Install Page".

---

## Troubleshooting
| Problem | Fix |
|--------|-----|
| `scheme "App" not found` | The shared scheme is committed at `ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` — make sure it was pushed. |
| `No signing certificate / profile` | Re-check Step 4 (API key) and that bundle id `com.hifdhi.app` exists and the team is selected. |
| Swift Package resolution fails | The `-skipPackagePluginValidation` flag is already set; ensure the chosen stack is Xcode 15+. |
| Blank screen in app | Supabase secrets missing — verify Step 5. |
| `npm: command not found` | Bitrise macOS stacks include Node; if not, add the **nvm** or **npm** step before the script. |

---

### Quick reference
| Item | Value |
|------|-------|
| App name | حِفْظِي |
| Bundle ID | `com.hifdhi.app` |
| Project | `ios/App/App.xcodeproj` |
| Scheme | `App` |
| Dependencies | Swift Package Manager (no CocoaPods) |
| Workflow | `build-ios` (in `bitrise.yml`) |
