# UpStart Back Office — Mobile

Personal iOS companion app for [UpStart Back Office](../../UpStart.BackOffice), built with Ionic + Angular + Capacitor. Talks to the same NestJS API and Cognito user pool as the admin web app.

## What's here

- **Dashboard** — running timer, hours today/this week, open invoices, quick links
- **Time** — start/stop timer, pick project + task, recent entries by day, swipe to delete
- **Clients** — searchable client list → client detail → project detail → tasks + "log time" shortcut
- **Invoices** — filter by status, line-item detail, in-app PDF viewer
- **Expenses** — snap a receipt photo (camera or library), log description/amount/category/project/reimbursable/billable, grouped by month, swipe to delete
- **Account** — profile from `/users/me`, sign out

Auth is Cognito username/password (SRP), same flow as `admin/src/app/core/cognito-auth.service.ts` — no hosted-UI browser redirect, so there's nothing extra to configure in the Cognito app client.

## First-time setup

```bash
npm install
```

## Running against your local dev API

1. In `UpStart.BackOffice`, run `npm run dev` (API on `http://localhost:3001`).
2. The API's `.env` `CORS_ORIGINS` already includes `capacitor://localhost` and `ionic://localhost` so the app's requests aren't blocked — if you ever regenerate `.env` from `.env.example`, keep those two origins in the list.
3. **iOS Simulator**: `src/environments/environment.ts` already points at `http://localhost:3001/api` and works as-is, since the simulator shares your Mac's network stack.
4. **Physical iPhone**: replace `localhost` in `environment.ts` with your Mac's LAN IP (same Wi-Fi network required), e.g. `http://192.168.1.42:3001/api`. Find it via System Settings → Wi-Fi → Details, or `ipconfig getifaddr en0` in Terminal.

## Building for iOS

```bash
npm run ios:sync:dev    # ng build (dev config) + cap sync ios
npm run ios:open        # opens Xcode
```

From Xcode, pick a simulator or your connected iPhone (Signing & Capabilities → set your Apple ID team for a physical device) and hit Run.

For anything pointed at production (`https://api.heyupstart.com/api`, same Cognito pool), use `npm run ios:sync:prod` instead — `environment.prod.ts` is already wired up.

## Versioning and shipping

Build/version/release scripts migrated from the LoveINC mobile app — see [docs/LAUNCH-COMMANDS.md](docs/LAUNCH-COMMANDS.md) for the full command reference. Quick start:

```bash
npm run version:patch     # bump src/app-version.json + sync Xcode's MARKETING_VERSION/CURRENT_PROJECT_VERSION
npm run ship:ios          # bump + production build + cap sync + strip live-reload config + open Xcode for Archive
npm run cap:run:ios:live  # live reload on device/simulator (patches applied automatically via postinstall)
```

The Account tab shows the current `v{version} (build)` from `src/app-version.json`. A `post-merge` git hook (installed via `npm run setup:git-hooks`) auto-bumps the patch version on every merge to `main`.

## UI polish from UpStart.MobileComponents

A handful of components from `UpStart.MobileComponents` were ported into `src/app/shared/ui/` and applied across the app:

- **`progress-ring`** — used on the Dashboard for today's/this week's hours (SVG ring, animated). Dropped the original's gradient-color option as unneeded; defaults to `var(--ion-color-primary)`.
- **`number-flipper`** — animating odometer-style digits, used for hours and the open-invoice total on the Dashboard. Extended to support decimals (original was whole-numbers only) and removed a truncation behavior that would have silently shrunk large currency values.
- **`button-bar`** — pill-style segmented control, replacing `ion-segment` on the Invoices status filter and the Expenses period filter. Re-themed from the source's solid-purple bar to a neutral track with a white pill and violet label, and added a `selectedValue` input for controlled selection.
- **Quick-action FAB** — adapted, not ported directly. The source's `tabs-fab` overlays a raised button in the tab bar itself; with 6 tabs already in this app's bar that didn't have a safe place to sit, so it's implemented as a per-page FAB (Clients and Invoices lists) opening an action sheet with "Start timer" / "Snap a receipt" shortcuts, via a shared `QuickActionsService`.

Skipped as not applicable here: `avatar-picker`, `feelings`, `video-header`, `gamification` (consumer/wellness-app specific), `date-scroller`/`calendar`/`weekday-picker`/`color-picker` (no matching feature, and the calendar depends on moment.js which wasn't worth adding), `about-modal` (fully branded content as-is). `progress-line-chart`, `share-sheet`, `rich-text-editor`, and `pdf-export` weren't needed for this pass but are worth a look if the app grows reporting or sharing features.

## Notes

- Sign-in uses your existing UpStart Back Office staff account (e.g. `jeff@heyupstart.com`) — same Cognito user pool as the admin app, so the same password works.
- The `tab1`/`tab2`/`tab3`/`explore-container` folders under `src/app/` are unused leftovers from the initial `ionic start` scaffold — no route references them, safe to delete manually whenever you like (this environment couldn't remove them for you).
- `capacitor.config.ts` sets `appId: com.heyupstart.backoffice` and `appName: UpStart Back Office` — change before shipping if you'd rather use something else.
- Receipt photos use `@capacitor/camera` — the first capture on a real device will prompt for camera/photo-library permission (`Info.plist` usage strings already added). Receipt parsing (auto-extracting vendor/amount/date from the photo) was scoped out for v1; the app just attaches the photo you take. The upload is a two-call flow matching the existing API exactly: `POST /expenses` then `POST /expenses/:id/receipt` (multipart) — there's no receipt-parsing endpoint on the backend, so this is pure mobile-side work.
