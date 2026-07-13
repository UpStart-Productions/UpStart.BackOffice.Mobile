// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Pointed at production so simulator, live-reload, and device builds all
  // hit the real API — no need to run `npm run dev` in UpStart.BackOffice
  // or fuss with LAN IPs for a physical device. To go back to the local API
  // for a specific debugging session, swap this back to
  // 'http://localhost:3001/api' (simulator) or 'http://<mac-lan-ip>:3001/api'
  // (physical device).
  apiBaseUrl: 'https://api.heyupstart.com/api',
  cognito: {
    userPoolId: 'us-west-2_IlJRXdK5X',
    userPoolClientId: '5oi5vfbt574mqect5psnqkqabn',
    region: 'us-west-2',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
