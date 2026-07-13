import { Component, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButton,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonNote,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonModal,
  IonDatetime,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  playOutline,
  stopOutline,
  trashOutline,
  timeOutline,
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ProjectsService } from '../../core/projects.service';
import { TimeEntriesService } from '../../core/time-entries.service';
import { Project, TimeEntry } from '../../core/models';
import {
  DateScrollerComponent,
  addDays,
  addDaysKey,
  keyToDate,
  mondayOf,
  toDateKey,
} from '../../shared/ui/date-scroller.component';

/** How far back to look when checking for a still-running timer — wide
 * enough to catch one you forgot to stop days ago, without pulling in every
 * week of history just to answer "is anything running right now?" */
const RUNNING_CHECK_DAYS_BACK = 30;

@Component({
  selector: 'app-time',
  templateUrl: 'time.page.html',
  styleUrls: ['time.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonButton,
    IonList,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonNote,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonModal,
    IonDatetime,
    DateScrollerComponent,
  ],
})
export class TimePage implements OnInit, OnDestroy {
  @ViewChild('calendarModal') calendarModal?: IonModal;

  readonly projects = signal<Project[]>([]);
  readonly runningEntry = signal<TimeEntry | null>(null);
  readonly weekEntries = signal<TimeEntry[]>([]);
  readonly loading = signal(false);
  readonly starting = signal(false);
  readonly elapsedLabel = signal('00:00:00');

  readonly selectedDate = signal(toDateKey(new Date()));
  readonly visibleWeekStart = signal(mondayOf(toDateKey(new Date())));

  selectedProjectId = '';
  selectedTaskId = '';
  description = '';

  readonly dayTotals = computed<Record<string, number>>(() => {
    const totals: Record<string, number> = {};
    for (const entry of this.weekEntries()) {
      if (!entry.stoppedAt) continue;
      const key = toDateKey(new Date(entry.startedAt));
      totals[key] = (totals[key] ?? 0) + (entry.durationMin ?? 0);
    }
    return totals;
  });

  readonly selectedDayEntries = computed(() =>
    this.weekEntries()
      .filter((e) => e.stoppedAt && toDateKey(new Date(e.startedAt)) === this.selectedDate())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
  );

  readonly selectedDayTotalMin = computed(() =>
    this.selectedDayEntries().reduce((sum, e) => sum + (e.durationMin ?? 0), 0),
  );

  readonly weekTotalMin = computed(() => {
    const totals = this.dayTotals();
    return Object.values(totals).reduce((sum, min) => sum + min, 0);
  });

  readonly selectedDateLabel = computed(() =>
    keyToDate(this.selectedDate()).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
  );

  readonly selectedProjectTasks = computed(() => {
    const project = this.projects().find((p) => p.id === this.selectedProjectId);
    return project?.tasks ?? [];
  });

  private tickHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly timeEntriesService: TimeEntriesService,
    private readonly projectsService: ProjectsService,
    private readonly authService: AuthService,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
    private readonly route: ActivatedRoute,
  ) {
    addIcons({
      playOutline,
      stopOutline,
      trashOutline,
      timeOutline,
      calendarOutline,
      chevronBackOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit(): void {
    const queryProjectId = this.route.snapshot.queryParamMap.get('projectId');
    if (queryProjectId) this.selectedProjectId = queryProjectId;
    this.refreshAll();
  }

  ionViewWillEnter(): void {
    this.refreshAll();
  }

  ngOnDestroy(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
  }

  refresh(event?: { target: { complete: () => void } }): void {
    this.loadRunningState();
    this.loadWeek(event);
  }

  private refreshAll(): void {
    this.loadRunningState();
    this.loadWeek();
  }

  private loadRunningState(): void {
    const userId = this.authService.currentUser()?.id;
    const from = new Date();
    from.setDate(from.getDate() - RUNNING_CHECK_DAYS_BACK);
    from.setHours(0, 0, 0, 0);

    forkJoin({
      projects: this.projectsService.list(),
      recent: this.timeEntriesService.list({ userId, from: from.toISOString() }),
    }).subscribe({
      next: ({ projects, recent }) => {
        this.projects.set(projects);
        const running = recent.find((e) => !e.stoppedAt) ?? null;
        this.setRunning(running);
      },
    });
  }

  private loadWeek(event?: { target: { complete: () => void } }): void {
    this.loading.set(true);
    const userId = this.authService.currentUser()?.id;
    const start = keyToDate(this.visibleWeekStart());
    const end = addDays(start, 7);

    this.timeEntriesService
      .list({ userId, from: start.toISOString(), to: end.toISOString() })
      .subscribe({
        next: (entries) => {
          this.weekEntries.set(entries);
          this.loading.set(false);
          event?.target.complete();
        },
        error: () => {
          this.loading.set(false);
          event?.target.complete();
        },
      });
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
    } else {
      this.elapsedLabel.set('00:00:00');
    }
  }

  private tick(): void {
    const entry = this.runningEntry();
    if (!entry) return;
    const ms = Date.now() - new Date(entry.startedAt).getTime();
    this.elapsedLabel.set(this.formatDuration(Math.max(0, Math.floor(ms / 1000))));
  }

  async startTimer(): Promise<void> {
    if (!this.selectedProjectId || this.starting()) return;
    this.starting.set(true);
    this.timeEntriesService
      .start({
        projectId: this.selectedProjectId,
        projectTaskId: this.selectedTaskId || undefined,
        description: this.description || undefined,
        startedAt: new Date().toISOString(),
      })
      .subscribe({
        next: (entry) => {
          this.starting.set(false);
          this.description = '';
          this.setRunning(entry);
          this.refreshAll();
        },
        error: async (err) => {
          this.starting.set(false);
          await this.toast(err?.error?.message ?? 'Could not start the timer.');
        },
      });
  }

  async stopTimer(): Promise<void> {
    const entry = this.runningEntry();
    if (!entry) return;
    this.timeEntriesService.stop(entry.id).subscribe({
      next: () => {
        this.setRunning(null);
        this.refreshAll();
      },
      error: async (err) => {
        await this.toast(err?.error?.message ?? 'Could not stop the timer.');
      },
    });
  }

  async deleteEntry(entry: TimeEntry, slidingItem: IonItemSliding): Promise<void> {
    await slidingItem.close();
    const alert = await this.alertController.create({
      header: 'Delete time entry?',
      message: `${this.projectLabel(entry)} — ${this.formatDuration((entry.durationMin ?? 0) * 60)}`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.timeEntriesService.remove(entry.id).subscribe(() => this.refreshAll());
          },
        },
      ],
    });
    await alert.present();
  }

  projectLabel(entry: TimeEntry): string {
    if (!entry.project) return 'Unknown project';
    const client = entry.project.client?.name;
    return client ? `${entry.project.name} · ${client}` : entry.project.name;
  }

  formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  /** H:MM, matching the Harvest-style time totals in the week strip. */
  formatHM(min: number | null): string {
    const total = min ?? 0;
    const h = Math.floor(total / 60);
    const m = Math.round(total % 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  }

  onDateSelected(date: string): void {
    this.selectedDate.set(date);
  }

  onWeekSwipe(direction: 'prev' | 'next'): void {
    this.shiftWeek(direction === 'prev' ? -7 : 7);
  }

  goToPreviousWeek(): void {
    this.shiftWeek(-7);
  }

  goToNextWeek(): void {
    this.shiftWeek(7);
  }

  jumpToToday(): void {
    const todayKey = toDateKey(new Date());
    this.selectedDate.set(todayKey);
    this.visibleWeekStart.set(mondayOf(todayKey));
    this.loadWeek();
  }

  onCalendarDateChange(event: CustomEvent): void {
    const raw = event.detail?.value as string | undefined;
    if (!raw) return;
    const key = raw.slice(0, 10);
    this.selectedDate.set(key);
    this.visibleWeekStart.set(mondayOf(key));
    this.loadWeek();
    this.calendarModal?.dismiss();
  }

  private shiftWeek(days: number): void {
    const offset = Math.round(
      (keyToDate(this.selectedDate()).getTime() - keyToDate(this.visibleWeekStart()).getTime()) /
        86400000,
    );
    const newStart = addDaysKey(this.visibleWeekStart(), days);
    this.visibleWeekStart.set(newStart);
    this.selectedDate.set(addDaysKey(newStart, offset));
    this.loadWeek();
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2500, color: 'danger' });
    await toast.present();
  }
}
