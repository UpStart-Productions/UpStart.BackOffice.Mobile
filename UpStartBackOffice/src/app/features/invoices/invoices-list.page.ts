import { Component, OnInit, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline, flashOutline } from 'ionicons/icons';
import { InvoicesService } from '../../core/invoices.service';
import { Invoice, InvoiceStatus } from '../../core/models';
import { ButtonBarComponent, ButtonBarConfig } from '../../shared/ui/button-bar.component';
import { QuickActionsService } from '../../core/quick-actions.service';

type FilterValue = 'ALL' | InvoiceStatus;

@Component({
  selector: 'app-invoices-list',
  templateUrl: 'invoices-list.page.html',
  styleUrls: ['invoices-list.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonLabel,
    IonList,
    IonItem,
    IonBadge,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton,
    ButtonBarComponent,
  ],
})
export class InvoicesListPage implements OnInit {
  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(false);
  filter = signal<FilterValue>('ALL');

  readonly filterConfig: ButtonBarConfig<FilterValue> = {
    buttons: [
      { label: 'All', value: 'ALL' },
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Sent', value: 'SENT' },
      { label: 'Paid', value: 'PAID' },
      { label: 'Void', value: 'VOID' },
    ],
  };

  readonly filteredInvoices = computed(() => {
    const f = this.filter();
    const list = this.invoices();
    return f === 'ALL' ? list : list.filter((i) => i.status === f);
  });

  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly quickActions: QuickActionsService,
  ) {
    addIcons({ documentTextOutline, flashOutline });
  }

  ngOnInit(): void {
    this.load();
  }

  ionViewWillEnter(): void {
    this.load();
  }

  load(event?: { target: { complete: () => void } }): void {
    this.loading.set(true);
    this.invoicesService.list().subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.loading.set(false);
        event?.target.complete();
      },
      error: () => {
        this.loading.set(false);
        event?.target.complete();
      },
    });
  }

  onFilterChange(value: FilterValue): void {
    this.filter.set(value);
  }

  openQuickActions(): void {
    this.quickActions.present();
  }

  statusColor(status: InvoiceStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'medium';
      case 'SENT':
        return 'warning';
      case 'PAID':
        return 'success';
      case 'VOID':
        return 'danger';
    }
  }
}
