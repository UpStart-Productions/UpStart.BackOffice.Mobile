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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { InvoicesService } from '../../core/invoices.service';
import { Invoice, InvoiceStatus } from '../../core/models';

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
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonBadge,
    IonIcon,
    IonSpinner,
  ],
})
export class InvoicesListPage implements OnInit {
  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(false);
  filter = signal<FilterValue>('ALL');

  readonly filteredInvoices = computed(() => {
    const f = this.filter();
    const list = this.invoices();
    return f === 'ALL' ? list : list.filter((i) => i.status === f);
  });

  constructor(private readonly invoicesService: InvoicesService) {
    addIcons({ documentTextOutline });
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
