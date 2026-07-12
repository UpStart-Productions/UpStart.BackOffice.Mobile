import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

export interface ButtonBarColors {
  buttonBarColor?: string;
  labelColor?: string;
  highlighterColor?: string;
  highlighterLabelColor?: string;
}

export interface ButtonBarButton<T = unknown> {
  label: string;
  value: T;
}

export interface ButtonBarConfig<T = unknown> {
  buttons: ButtonBarButton<T>[];
  colors?: ButtonBarColors;
}

/**
 * Animated segmented control with a sliding pill highlight. Ported from
 * UpStart.MobileComponents (widgets/button-bar) and re-themed to the brand
 * palette (violet-on-neutral instead of NephoPhone's solid purple bar) —
 * fits better as a filter control sitting on white/card backgrounds. Also
 * adds `selectedValue` so a parent can drive the initial/current selection
 * instead of the control always starting at index 0.
 *
 * @example
 * <app-button-bar
 *   [config]="{ buttons: [{ label: 'All', value: 'ALL' }, { label: 'Paid', value: 'PAID' }] }"
 *   [selectedValue]="filter()"
 *   (buttonSelectedEvent)="onFilterChange($event)">
 * </app-button-bar>
 */
@Component({
  selector: 'app-button-bar',
  templateUrl: './button-bar.component.html',
  styleUrls: ['./button-bar.component.scss'],
})
export class ButtonBarComponent<T = unknown> implements OnChanges {
  @Input() config: ButtonBarConfig<T> = { buttons: [] };
  /** Optional controlled selection — sets the highlighted button by value. */
  @Input() selectedValue?: T;
  @Output() buttonSelectedEvent = new EventEmitter<T>();

  selectedIndex = 0;

  readonly defaultColors: ButtonBarColors = {
    buttonBarColor: 'var(--ion-color-step-100, #eeeeec)',
    labelColor: 'var(--ubo-text-muted, #6b6b6b)',
    highlighterColor: '#ffffff',
    highlighterLabelColor: 'var(--ion-color-primary)',
  };

  get mergedColors(): ButtonBarColors {
    return { ...this.defaultColors, ...this.config.colors };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedValue'] || changes['config']) {
      this.syncSelectedIndex();
    }
  }

  private syncSelectedIndex(): void {
    if (this.selectedValue === undefined) return;
    const index = this.config.buttons.findIndex((b) => b.value === this.selectedValue);
    if (index >= 0) this.selectedIndex = index;
  }

  selectButton(index: number): void {
    this.selectedIndex = index;
    this.buttonSelectedEvent.emit(this.config.buttons[index].value);
  }
}
