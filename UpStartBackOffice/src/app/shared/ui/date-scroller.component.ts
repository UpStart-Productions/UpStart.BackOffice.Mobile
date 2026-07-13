import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

export interface WeekDay {
  /** YYYY-MM-DD, local time. */
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  totalMin: number;
}

const SWIPE_THRESHOLD_PX = 40;

/**
 * Monday-start week strip for the Time tab. Originally ported from
 * UpStart.MobileComponents' date-widgets/date-scroller (an infinitely
 * horizontal-scrolling strip of individual days), then substantially
 * redesigned to match Harvest's timesheet UI: this always shows exactly one
 * Monday-Sunday week with each day's logged-time total underneath (Harvest's
 * "6:30" per day). Which week is visible is driven entirely by the parent
 * (chevron buttons, calendar jump) via the `weekStart` input — this
 * component just renders that week and recognizes a horizontal swipe on the
 * strip itself, emitting `weekSwipeEvent` so the parent can page a full
 * week without a dedicated button tap.
 *
 * @example
 * <app-date-scroller
 *   [weekStart]="visibleWeekStart()"
 *   [selectedDate]="selectedDate()"
 *   [dayTotals]="dayTotals()"
 *   (dateSelectedEvent)="onDateSelected($event)"
 *   (weekSwipeEvent)="onWeekSwipe($event)">
 * </app-date-scroller>
 */
@Component({
  selector: 'app-date-scroller',
  templateUrl: './date-scroller.component.html',
  styleUrls: ['./date-scroller.component.scss'],
})
export class DateScrollerComponent implements OnChanges {
  @ViewChild('stripEl', { static: false }) stripEl?: ElementRef<HTMLElement>;

  /** Monday of the visible week, YYYY-MM-DD. */
  @Input() weekStart = '';
  @Input() selectedDate = '';
  /** date (YYYY-MM-DD) -> total minutes logged that day. */
  @Input() dayTotals: Record<string, number> = {};

  @Output() dateSelectedEvent = new EventEmitter<string>();
  @Output() weekSwipeEvent = new EventEmitter<'prev' | 'next'>();

  days: WeekDay[] = [];

  private touchStartX = 0;
  private touchStartY = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weekStart'] || changes['selectedDate'] || changes['dayTotals']) {
      this.buildDays();
    }
  }

  select(day: WeekDay): void {
    if (day.date === this.selectedDate) return;
    this.dateSelectedEvent.emit(day.date);
  }

  onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;
    this.weekSwipeEvent.emit(deltaX < 0 ? 'next' : 'prev');
  }

  formatHM(min: number): string {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  }

  private buildDays(): void {
    if (!this.weekStart) {
      this.days = [];
      return;
    }
    const todayKey = toDateKey(new Date());
    const start = keyToDate(this.weekStart);
    this.days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      const key = toDateKey(date);
      return {
        date: key,
        dayName: dayNameFormatter.format(date),
        dayNumber: date.getDate(),
        isToday: key === todayKey,
        isSelected: key === this.selectedDate,
        totalMin: this.dayTotals[key] ?? 0,
      };
    });
  }
}

const dayNameFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + amount);
  return d;
}

export function addDaysKey(key: string, amount: number): string {
  return toDateKey(addDays(keyToDate(key), amount));
}

/** Monday of the week containing the given date key. */
export function mondayOf(key: string): string {
  const date = keyToDate(key);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  return toDateKey(addDays(date, diff));
}
