import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, personCircleOutline, mailOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { AppVersionService } from '../../core/app-version.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonIcon,
  ],
})
export class AccountPage {
  readonly user = this.authService.currentUser;
  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly appVersion = this.appVersionService.snapshot;

  constructor(
    private readonly authService: AuthService,
    private readonly appVersionService: AppVersionService,
    private readonly router: Router,
    private readonly alertController: AlertController,
  ) {
    addIcons({ logOutOutline, personCircleOutline, mailOutline, shieldCheckmarkOutline });
  }

  async signOut(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Sign out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Sign out',
          role: 'destructive',
          handler: async () => {
            await this.authService.signOutUser();
            this.router.navigateByUrl('/login');
          },
        },
      ],
    });
    await alert.present();
  }
}
