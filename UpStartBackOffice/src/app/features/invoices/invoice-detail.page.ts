import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { InvoicesService } from '../../core/invoices.service';
import { Invoice, InvoiceStatus } from '../../core/models';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: 'invoice-detail.page.html',
  styleUrls: ['invoice-detail.page.scss'],
  imports: [
    RouterLink,
    DecimalPipe,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class InvoiceDetailPage implements OnInit {
  readonly invoice = signal<Invoice | null>(null);
  readonly loading = signal(true);
  invoiceId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly invoicesService: InvoicesService,
  ) {
    addIcons({ documentTextOutline });
  }

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.invoiceId) return;
    this.invoicesService.get(this.invoiceId).subscribe({
      next: (invoice) => {
        this.invoice.set(invoice);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
