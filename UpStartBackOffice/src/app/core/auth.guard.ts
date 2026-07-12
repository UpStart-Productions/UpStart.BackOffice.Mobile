import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Guards the authenticated area of the app (tabs and everything under them). */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ready();
  if (authService.isAuthenticated()) return true;
  return router.parseUrl('/login');
};

/** Guards the login page — if already signed in, skip straight to the app. */
export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ready();
  if (!authService.isAuthenticated()) return true;
  return router.parseUrl('/tabs/dashboard');
};
