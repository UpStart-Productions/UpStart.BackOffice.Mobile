import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Expense } from './models';

export interface ExpensePayload {
  description: string;
  amount: number;
  category?: string;
  incurredAt: string;
  projectId?: string;
  isReimbursable?: boolean;
  isBillable?: boolean;
  paymentMethod?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  constructor(private readonly api: ApiService) {}

  list(params: { userId?: string; projectId?: string; from?: string; to?: string }): Observable<
    Expense[]
  > {
    return this.api.get<Expense[]>('/expenses', params);
  }

  get(id: string): Observable<Expense> {
    return this.api.get<Expense>(`/expenses/${id}`);
  }

  create(payload: ExpensePayload): Observable<Expense> {
    return this.api.post<Expense>('/expenses', payload);
  }

  update(id: string, payload: Partial<ExpensePayload>): Observable<Expense> {
    return this.api.put<Expense>(`/expenses/${id}`, payload);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/expenses/${id}`);
  }

  /** Uploads/replaces the receipt image on an existing expense. Returns the
   * updated expense (with receiptUrl set). */
  uploadReceipt(id: string, file: Blob, fileName: string): Observable<Expense> {
    return this.api.postFile<Expense>(`/expenses/${id}/receipt`, file, fileName);
  }
}
