import { Component, Input, OnChanges } from '@angular/core';

/**
 * Odometer-style animated digit-flip number display. Ported and extended
 * from UpStart.MobileComponents (widgets/number-flipper) — the original only
 * handled whole numbers; this version adds decimal support (needed for
 * hours like "3.5h") and drops the original's lossy >1000 "K" truncation,
 * which silently divided the displayed value without labeling it as
 * thousands — not safe for currency.
 *
 * @example
 * <app-number-flipper [value]="3.5" [decimals]="1" suffix="h"></app-number-flipper>
 */
@Component({
  selector: 'app-number-flipper',
  templateUrl: './number-flipper.component.html',
  styleUrls: ['./number-flipper.component.scss'],
})
export class NumberFlipperComponent implements OnChanges {
  @Input() value = 0;
  /** Decimal places to render (each decimal digit also animates). */
  @Input() decimals = 0;
  @Input() digitHeight = 32;
  /** Static text appended after the number, e.g. "h" — does not animate. */
  @Input() suffix = '';

  intDigits: number[] = [];
  decDigits: number[] = [];
  readonly digitRange = Array.from({ length: 10 }, (_, i) => i);

  ngOnChanges(): void {
    const safeValue = Number.isFinite(this.value) ? Math.max(0, this.value) : 0;
    const fixed = safeValue.toFixed(Math.max(0, this.decimals));
    const [intPart, decPart] = fixed.split('.');
    this.intDigits = intPart.split('').map(Number);
    this.decDigits = decPart ? decPart.split('').map(Number) : [];
  }
}
