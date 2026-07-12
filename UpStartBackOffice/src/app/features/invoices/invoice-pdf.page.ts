import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { InvoicesService } from '../../core/invoices.service';

@Component({
  selector: 'app-invoice-pdf',
  templateUrl: 'invoice-pdf.page.html',
  styleUrls: ['invoice-pdf.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonSpinner, IonText],
})
export class InvoicePdfPage implements OnInit, OnDestroy {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  invoiceId = '';

  private objectUrl: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly invoicesService: InvoicesService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.invoiceId) return;
    this.invoicesService.getPdfBlob(this.invoiceId).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }
}
