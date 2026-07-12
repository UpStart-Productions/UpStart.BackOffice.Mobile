import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
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
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playOutline, stopOutline, trashOutline, timeOutline } from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ProjectsService } from '../../core/projects.service';
import { TimeEntriesService } from '../../core/time-entries.service';
import { Project, TimeEntry } from '../../core/models';

interface DayGroup {
  label: string;
  entries: TimeEntry[];
  totalMin: number;
}

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
  ],
})
export class TimePage implements OnInit, OnDestroy {
  readonly projects = signal<Project[]>([]);
  readonly runningEntry = signal<TimeEntry | null>(null);
  readonly entries = signal<TimeEntry[]>([]);
  readonly loading = signal(false);
  readonly starting = signal(false);
  readonly elapsedLabel = signal('00:00:00');

  selectedProjectId = '';
  selectedTaskId = '';
  description = '';

  readonly dayGroups = computed<DayGroup[]>(() => this.groupByDay(this.entries()));

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
    addIcons({ playOutline, stopOutline, trashOutline, timeOutline });
  }

  ngOnInit(): void {
    const queryProjectId = this.route.snapshot.queryParamMap.get('projectId');
    if (queryProjectId) this.selectedProjectId = queryProjectId;
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
    const from = new Date();
    from.setDate(from.getDate() - 13);
    from.setHours(0, 0, 0, 0);

    forkJoin({
      projects: this.projectsService.list(),
      entries: this.timeEntriesService.list({ userId, from: from.toISOString() }),
    }).subscribe({
      next: ({ projects, entries }) => {
        this.projects.set(projects);
        this.entries.set(entries);
        const running = entries.find((e) => !e.stoppedAt) ?? null;
        this.setRunning(running);
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
          this.load();
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
        this.load();
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
            this.timeEntriesService.remove(entry.id).subscribe(() => this.load());
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

  formatMinutes(min: number | null): string {
    if (!min) return '0m';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  private groupByDay(entries: TimeEntry[]): DayGroup[] {
    const stopped = entries.filter((e) => e.stoppedAt);
    const groups = new Map<string, TimeEntry[]>();
    for (const entry of stopped) {
      const key = new Date(entry.startedAt).toDateString();
      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
    }
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    return Array.from(groups.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([key, list]) => ({
        label:
          key === today
            ? 'Today'
            : key === yesterday
              ? 'Yesterday'
              : new Date(key).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }),
        entries: list.sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        ),
        totalMin: list.reduce((sum, e) => sum + (e.durationMin ?? 0), 0),
      }));
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2500, color: 'danger' });
    await toast.present();
  }
}
