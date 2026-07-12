import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Circular progress indicator. Ported from UpStart.MobileComponents
 * (widgets/progress-ring) — zero dependencies, defaults to the app's
 * --ion-color-primary so it's on-brand with no configuration needed.
 *
 * @example
 * <app-progress-ring [progress]="62" [size]="88" centerText="3.1h"></app-progress-ring>
 */
@Component({
  selector: 'app-progress-ring',
  templateUrl: './progress-ring.component.html',
  styleUrls: ['./progress-ring.component.scss'],
})
export class ProgressRingComponent implements OnChanges {
  /** Progress value (0-100) */
  @Input() progress = 0;
  /** Ring size in pixels */
  @Input() size = 120;
  /** Stroke width in pixels */
  @Input() strokeWidth = 10;
  /** Progress color (hex, rgb, or CSS variable) — defaults to brand primary */
  @Input() color = '';
  /** Background ring color */
  @Input() backgroundColor = 'var(--ion-color-step-150, #e5e5e3)';
  /** Text shown in the center (e.g. "3.1h", "62%") */
  @Input() centerText = '';
  /** Animation duration in milliseconds */
  @Input() animationDuration = 400;

  radius = 0;
  circumference = 0;
  strokeDashoffset = 0;
  currentColor = '';

  ngOnChanges(_changes: SimpleChanges): void {
    this.calculateValues();
  }

  private calculateValues(): void {
    this.radius = this.size / 2 - this.strokeWidth / 2 - 2;
    this.circumference = 2 * Math.PI * this.radius;
    const progressValue = Math.min(100, Math.max(0, this.progress));
    this.strokeDashoffset = this.circumference - (this.circumference * progressValue) / 100;
    this.currentColor = this.color || 'var(--ion-color-primary)';
  }
}
