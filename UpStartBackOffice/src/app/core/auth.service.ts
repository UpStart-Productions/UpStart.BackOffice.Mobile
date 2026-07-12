import { Injectable, signal } from '@angular/core';
import { Amplify } from 'aws-amplify';
import {
  confirmResetPassword,
  confirmSignIn,
  fetchAuthSession,
  fetchUserAttributes,
  resetPassword,
  signIn,
  signOut,
} from 'aws-amplify/auth';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from './models';

export type AuthState = 'unknown' | 'authenticated' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly state = signal<AuthState>('unknown');
  readonly currentUser = signal<CurrentUser | null>(null);

  private cachedIdToken: string | null = null;
  private readonly readyPromise: Promise<void>;

  constructor(private readonly http: HttpClient) {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: environment.cognito.userPoolId,
          userPoolClientId: environment.cognito.userPoolClientId,
        },
      },
    });
    this.readyPromise = this.restoreSession();
  }

  /** Resolves once the initial session check (if any) has completed. */
  ready(): Promise<void> {
    return this.readyPromise;
  }

  isAuthenticated(): boolean {
    return this.state() === 'authenticated';
  }

  private async restoreSession(): Promise<void> {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString() ?? null;
      if (!idToken) {
        this.state.set('unauthenticated');
        return;
      }
      this.cachedIdToken = idToken;
      await this.loadCurrentUser();
      this.state.set('authenticated');
    } catch {
      this.cachedIdToken = null;
      this.state.set('unauthenticated');
    }
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ needsNewPassword: boolean }> {
    const result = await signIn({ username: email.trim(), password });
    const step = (result as { nextStep?: { signInStep?: string } }).nextStep?.signInStep;
    const needsNewPassword =
      step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' ||
      step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD';
    if (needsNewPassword) {
      return { needsNewPassword: true };
    }
    await this.completeSignIn();
    return { needsNewPassword: false };
  }

  async confirmSignInWithNewPassword(newPassword: string): Promise<void> {
    await confirmSignIn({ challengeResponse: newPassword });
    await this.completeSignIn();
  }

  private async completeSignIn(): Promise<void> {
    const session = await fetchAuthSession();
    this.cachedIdToken = session.tokens?.idToken?.toString() ?? null;
    await this.loadCurrentUser();
    this.state.set('authenticated');
  }

  async requestPasswordReset(email: string): Promise<{ deliveryMedium: string }> {
    const result = await resetPassword({ username: email.trim() });
    return { deliveryMedium: result.nextStep?.codeDeliveryDetails?.deliveryMedium ?? 'EMAIL' };
  }

  async confirmPasswordReset(
    email: string,
    confirmationCode: string,
    newPassword: string,
  ): Promise<void> {
    await confirmResetPassword({
      username: email.trim(),
      confirmationCode: confirmationCode.trim(),
      newPassword,
    });
  }

  async signOutUser(): Promise<void> {
    this.cachedIdToken = null;
    this.currentUser.set(null);
    try {
      await signOut({ global: true });
    } catch {
      /* ignore — still clear local state below */
    }
    this.state.set('unauthenticated');
  }

  async getIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      this.cachedIdToken = session.tokens?.idToken?.toString() ?? null;
      if (!this.cachedIdToken) return this.refreshToken();
      return this.cachedIdToken;
    } catch {
      return this.refreshToken();
    }
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      this.cachedIdToken = session.tokens?.idToken?.toString() ?? null;
    } catch {
      this.cachedIdToken = null;
    }
    return this.cachedIdToken;
  }

  async getEmailFromSession(): Promise<string | null> {
    try {
      const attrs = await fetchUserAttributes();
      return attrs.email ?? attrs.preferred_username ?? null;
    } catch {
      return null;
    }
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<CurrentUser>(`${environment.apiBaseUrl}/users/me`),
      );
      this.currentUser.set(user);
    } catch {
      this.currentUser.set(null);
    }
  }

  /** Called by the auth interceptor on a 401 — drops local session state only. */
  handleUnauthorized(): void {
    this.cachedIdToken = null;
    this.currentUser.set(null);
    this.state.set('unauthenticated');
  }
}
