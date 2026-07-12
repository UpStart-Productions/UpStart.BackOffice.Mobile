# Launch and ship commands

Commands below are defined in `package.json`. Run them with **`npm run <script>`** (for example `npm run cap:run:ios`).

This app targets **iOS** (device and simulator), not the web, though `ng serve` still works for quick UI iteration against a mocked or CORS-permissive API.

## App version (source of truth)

- **`src/app-version.json`** holds **`version`** (marketing / `CFBundleShortVersionString`) and **`build`** (integer / `CFBundleVersion`). The **Account** tab shows **`v{version} (build)`**.
- **`npm run version:patch`** / **`version:minor`** / **`version:major`** — bumps semver and **increments `build`**, writes JSON, and updates **`ios/App/App.xcodeproj/project.pbxproj`** (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`).
- **`npm run version:build`** — **increments `build` only** (same marketing version), syncs Xcode — use between App Store uploads when the version string stays the same.
- **`npm run version:sync-ios`** — rewrites Xcode from current `app-version.json` (fix drift after manual edits).
- **`npm run setup:git-hooks`** *(optional)* — installs a **post-merge** hook on **`main`** that runs **`version:patch`** and commits `src/app-version.json` + `project.pbxproj`. Already installed in this repo (`../.git/hooks/post-merge`); re-run the command if you ever need to reinstall it.

| Command | What it does |
|--------|----------------|
| **`start`** | Runs `ng serve` — Angular dev server (browser). Not the primary workflow for this app. |
| **`build`** | Runs `ng build` — default Angular build into `www` (production config by default; see `angular.json`). |
| **`build:dev`** | `ng build --configuration development` — dev build against `environment.ts` (local API). |
| **`watch`** | `ng build --watch --configuration development` — rebuilds `www` on file changes; pair with a separate `cap sync` / run when needed. |
| **`cap:sync`** | `ng build` then `npx cap sync` — copies the **default** (production-config) web build to the native iOS project and updates native Capacitor config from `capacitor.config.ts`. |
| **`cap:run:ios`** | `ng build`, `cap sync`, then `cap run ios` — build, sync, and launch on the chosen iOS simulator or device using the **bundled `www`** (no live reload). |
| **`cap:run:ios:live`** | `ionic cap run ios -l --external` — **live reload**: WebView loads from your Mac (LAN URL). Small post-install patches (`patches/*.patch`) make this work with **Angular esbuild/vite** (`@ionic/cli` 7.2 + **`--external`**). Injects `server` into `ios/App/App/capacitor.config.json`. **Do not ship** an archive built while `server` is present; use **`npm run ship:ios`**. |
| **`cap:test:ios`** | Same as `cap:run:ios`. Useful alias for a quick device/simulator run. |
| **`cap:pod:install`** | Runs `pod install` under `ios/App` — run after native dependency changes; not a full launch by itself. |
| **`ios:sync:dev`** | `ng build --configuration development && npx cap sync ios` — sync a build pointed at your **local dev API** (`environment.ts`). |
| **`ios:sync:prod`** | `ng build --configuration production && npx cap sync ios` — sync a build pointed at the **production API** (`environment.prod.ts`). |
| **`ios:open`** | `npx cap open ios` — opens the Xcode workspace without building/syncing first. |
| **`version:patch`**, **`version:minor`**, **`version:major`**, **`version:build`**, **`version:sync-ios`** | See **App version** above. |
| **`increment-ios-build`** | Same as **`version:build`** (updates `app-version.json` + Xcode). Used by **`ship:ios`**. |
| **`ship:ios`** | **App Store / release pipeline:** runs `scripts/ship-ios-app-store.js` — **`version:patch`** by default (bump + sync Xcode), production `ng build`, `cap sync ios`, **strips any `server` block** from `ios/App/App/capacitor.config.json` (removes live-reload URL), opens `ios/App/App.xcworkspace` in Xcode for **Archive** and upload. `ship:ios:build` / `ship:ios:minor` / `ship:ios:major` pass the matching bump type through. |

## Reference

- Root Capacitor config: `capacitor.config.ts` (no `server` key in repo — correct for release).
- Synced iOS file (generated, gitignored): `ios/App/App/capacitor.config.json` — must **not** contain `server.url` in builds you upload to App Store Connect.
- Live-reload patches (`patches/@ionic+cli+7.2.1.patch`, `patches/@ionic+utils-network+2.1.7.patch`) are applied automatically via `postinstall` (`patch-package`) after `npm install`. Migrated from the LoveINC mobile app — fix Ionic CLI's dev-server readiness detection against Angular's esbuild/vite pipeline.
