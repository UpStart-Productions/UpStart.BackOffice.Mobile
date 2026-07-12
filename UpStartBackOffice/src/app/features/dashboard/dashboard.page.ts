import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  stopwatchOutline,
  stopOutline,
  peopleOutline,
  documentTextOutline,
  timeOutline,
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { TimeEntriesService } from '../../core/time-entries.service';
import { InvoicesService } from '../../core/invoices.service';
import { Invoice, TimeEntry } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButton,
    IonBadge,
  ],
})
export class DashboardPage implements OnInit, OnDestroy {
  readonly runningEntry = signal<TimeEntry | null>(null);
  readonly elapsedLabel = signal('00:00:00');
  readonly hoursToday = signal(0);
  readonly hoursWeek = signal(0);
  readonly openInvoiceCount = signal(0);
  readonly openInvoiceTotal = signal(0);
  readonly loading = signal(false);

  readonly userName = computed(() => this.authService.currentUser()?.name ?? '');
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  private tickHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly authService: AuthService,
    private readonly timeEntriesService: TimeEntriesService,
    private readonly invoicesService: InvoicesService,
    private readonly router: Router,
  ) {
    addIcons({ stopwatchOutline, stopOutline, peopleOutline, documentTextOutline, timeOutline });
  }

  ngOnInit(): void {
    this.load();
  }

  ionViewWillEnter(): void {
    this.load();
  }

  ngOnDestroy(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
  }

  load(event?: { target: { complete: () => void } }): void {
    this.loading.set(true);
    const userId = this.authService.currentUser()?.id;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    forkJoin({
      entries: this.timeEntriesService.list({ userId, from: weekStart.toISOString() }),
      invoices: this.invoicesService.list(),
    }).subscribe({
      next: ({ entries, invoices }) => {
        this.computeTimeStats(entries);
        this.computeInvoiceStats(invoices);
        this.loading.set(false);
        event?.target.complete();
      },
      error: () => {
        this.loading.set(false);
        event?.target.complete();
      },
    });
  }

  private computeTimeStats(entries: TimeEntry[]): void {
    const running = entries.find((e) => !e.stoppedAt) ?? null;
    this.setRunning(running);

    const todayKey = new Date().toDateString();
    let todayMin = 0;
    let weekMin = 0;
    for (const entry of entries) {
      if (!entry.durationMin) continue;
      weekMin += entry.durationMin;
      if (new Date(entry.startedAt).toDateString() === todayKey) {
        todayMin += entry.durationMin;
      }
    }
    this.hoursToday.set(Math.round((todayMin / 60) * 10) / 10);
    this.hoursWeek.set(Math.round((weekMin / 60) * 10) / 10);
  }

  private computeInvoiceStats(invoices: Invoice[]): void {
    const open = invoices.filter((i) => i.status === 'SENT');
    this.openInvoiceCount.set(open.length);
    this.openInvoiceTotal.set(
      open.reduce((sum, i) => sum + (i.total - (i.amountPaid ?? 0)), 0),
    );
  }

  private setRunning(entry: TimeEntry | null): void {
    this.runningEntry.set(entry);
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = undefined;
    }
    if (entry) {
      this.tick();
      this.tickHandle = setInterval(() => this.tick(), 1000);
    }
  }

  private tick(): void {
    const entry = this.runningEntry();
    if (!entry) return;
    const ms = Date.now() - new Date(entry.startedAt).getTime();
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    this.elapsedLabel.set(`${pad(h)}:${pad(m)}:${pad(s)}`);
  }

  stopTimer(): void {
    const entry = this.runningEntry();
    if (!entry) return;
    this.timeEntriesService.stop(entry.id).subscribe(() => this.load());
  }

  goTo(path: string): void {
    this.router.navigateByUrl(path);
  }
}
