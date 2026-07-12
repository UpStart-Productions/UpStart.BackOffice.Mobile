import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular/standalone';

/** Shared "what do you want to do" action sheet — surfaced via a FAB on
 * pages that aren't themselves the fast path to Time/Expenses, inspired by
 * the tabs-fab pattern in UpStart.MobileComponents. A true tab-bar-overlay
 * FAB didn't fit cleanly with 6 tab buttons already in the bar, so this is
 * delivered as a per-page FAB instead (same proven pattern already used on
 * the Expenses list's "add" button). */
@Injectable({ providedIn: 'root' })
export class QuickActionsService {
  constructor(
    private readonly actionSheetController: ActionSheetController,
    private readonly router: Router,
  ) {}

  async present(): Promise<void> {
    const sheet = await this.actionSheetController.create({
      header: 'Quick actions',
      buttons: [
        {
          text: 'Start timer',
          icon: 'stopwatch-outline',
          handler: () => this.router.navigateByUrl('/tabs/time'),
        },
        {
          text: 'Snap a receipt',
          icon: 'camera-outline',
          handler: () => this.router.navigateByUrl('/tabs/expenses/new'),
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }
}
