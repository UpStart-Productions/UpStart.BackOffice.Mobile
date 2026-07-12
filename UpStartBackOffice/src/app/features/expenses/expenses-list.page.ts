import { Component, OnInit, computed, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonList,
  IonItemSliding,
  IonItem,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonNote,
  IonThumbnail,
  IonBadge,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  receiptOutline,
  trashOutline,
  cashOutline,
  cardOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { ExpensesService } from '../../core/expenses.service';
import { Expense } from '../../core/models';
import { resolveAssetUrl } from '../../core/asset-url.util';
import { ButtonBarComponent, ButtonBarConfig } from '../../shared/ui/button-bar.component';

interface MonthGroup {
  label: string;
  expenses: Expense[];
  total: number;
}

type PeriodValue = '1M' | '3M' | '6M' | 'ALL';

const PERIOD_DAYS: Record<Exclude<PeriodValue, 'ALL'>, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
};

@Component({
  selector: 'app-expenses-list',
  templateUrl: 'expenses-list.page.html',
  styleUrls: ['expenses-list.page.scss'],
  imports: [
    DecimalPipe,
    DatePipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonList,
    IonItemSliding,
    IonItem,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonNote,
    IonThumbnail,
    IonBadge,
    IonSpinner,
    ButtonBarComponent,
  ],
})
export class ExpensesListPage implements OnInit {
  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal(false);
  readonly period = signal<PeriodValue>('3M');

  readonly periodConfig: ButtonBarConfig<PeriodValue> = {
    buttons: [
      { label: '1 Month', value: '1M' },
      { label: '3 Months', value: '3M' },
      { label: '6 Months', value: '6M' },
      { label: 'All', value: 'ALL' },
    ],
  };

  readonly monthGroups = computed<MonthGroup[]>(() => this.groupByMonth(this.expenses()));

  constructor(
    private readonly expensesService: ExpensesService,
    private readonly authService: AuthService,
    private readonly alertController: AlertController,
  ) {
    addIcons({ addOutline, receiptOutline, trashOutline, cashOutline, cardOutline });
  }

  ngOnInit(): void {
    this.load();
  }

  ionViewWillEnter(): void {
    this.load();
  }

  onPeriodChange(value: PeriodValue): void {
    this.period.set(value);
    this.load();
  }

  load(event?: { target: { complete: () => void } }): void {
    this.loading.set(true);
    const userId = this.authService.currentUser()?.id;
    const period = this.period();
    let from: string | undefined;
    if (period !== 'ALL') {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - PERIOD_DAYS[period]);
      fromDate.setHours(0, 0, 0, 0);
      from = fromDate.toISOString();
    }

    this.expensesService.list({ userId, from }).subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.loading.set(false);
        event?.target.complete();
      },
      error: () => {
        this.loading.set(false);
        event?.target.complete();
      },
    });
  }

  receiptThumb(expense: Expense): string | null {
    return resolveAssetUrl(expense.receiptUrl);
  }

  async deleteExpense(expense: Expense, slidingItem: IonItemSliding): Promise<void> {
    await slidingItem.close();
    const alert = await this.alertController.create({
      header: 'Delete expense?',
      message: `${expense.description} — ${expense.amount.toFixed(2)}`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.expensesService.remove(expense.id).subscribe(() => this.load());
          },
        },
      ],
    });
    await alert.present();
  }

  private groupByMonth(expenses: Expense[]): MonthGroup[] {
    const groups = new Map<string, Expense[]>();
    for (const expense of expenses) {
      const d = new Date(expense.incurredAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const list = groups.get(key) ?? [];
      list.push(expense);
      groups.set(key, list);
    }
    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, list]) => {
        const [year, month] = key.split('-').map(Number);
        const label = new Date(year, month, 1).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        });
        return {
          label,
          expenses: list.sort(
            (a, b) => new Date(b.incurredAt).getTime() - new Date(a.incurredAt).getTime(),
          ),
          total: list.reduce((sum, e) => sum + Number(e.amount), 0),
        };
      });
  }
}
