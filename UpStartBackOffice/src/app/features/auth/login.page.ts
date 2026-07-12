import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mailOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
  ],
})
export class LoginPage {
  email = '';
  password = '';
  newPassword = '';
  confirmNewPassword = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly needsNewPassword = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    addIcons({ lockClosedOutline, mailOutline });
  }

  async signIn(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.authService.signInWithPassword(this.email, this.password);
      if (result.needsNewPassword) {
        this.needsNewPassword.set(true);
        return;
      }
      this.router.navigateByUrl('/tabs/dashboard');
    } catch (err) {
      this.error.set(this.friendlyError(err));
    } finally {
      this.loading.set(false);
    }
  }

  async setNewPassword(): Promise<void> {
    if (!this.newPassword || this.newPassword !== this.confirmNewPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.confirmSignInWithNewPassword(this.newPassword);
      this.router.navigateByUrl('/tabs/dashboard');
    } catch (err) {
      this.error.set(this.friendlyError(err));
    } finally {
      this.loading.set(false);
    }
  }

  private friendlyError(err: unknown): string {
    const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
    if (/incorrect username or password/i.test(message)) {
      return 'Incorrect email or password.';
    }
    if (/user does not exist/i.test(message)) {
      return 'No account found for that email.';
    }
    return message;
  }
}
