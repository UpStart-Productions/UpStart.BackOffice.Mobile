import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Invoice } from './models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  constructor(private readonly api: ApiService) {}

  list(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>('/invoices');
  }

  get(id: string): Observable<Invoice> {
    return this.api.get<Invoice>(`/invoices/${id}`);
  }

  getPdfBlob(id: string): Observable<Blob> {
    return this.api.getBlob(`/invoices/${id}/pdf`);
  }
}
