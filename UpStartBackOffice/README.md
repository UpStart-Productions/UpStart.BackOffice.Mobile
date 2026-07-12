# UpStart Back Office — Mobile

Personal iOS companion app for [UpStart Back Office](../../UpStart.BackOffice), built with Ionic + Angular + Capacitor. Talks to the same NestJS API and Cognito user pool as the admin web app.

## What's here

- **Dashboard** — running timer, hours today/this week, open invoices, quick links
- **Time** — start/stop timer, pick project + task, recent entries by day, swipe to delete
- **Clients** — searchable client list → client detail → project detail → tasks + "log time" shortcut
- **Invoices** — filter by status, line-item detail, in-app PDF viewer
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

## Notes

- Sign-in uses your existing UpStart Back Office staff account (e.g. `jeff@heyupstart.com`) — same Cognito user pool as the admin app, so the same password works.
- The `tab1`/`tab2`/`tab3`/`explore-container` folders under `src/app/` are unused leftovers from the initial `ionic start` scaffold — no route references them, safe to delete manually whenever you like (this environment couldn't remove them for you).
- `capacitor.config.ts` sets `appId: com.heyupstart.backoffice` and `appName: UpStart Back Office` — change before shipping if you'd rather use something else.
