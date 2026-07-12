import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonLabel,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonSpinner,
  IonThumbnail,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, trashOutline, receiptOutline } from 'ionicons/icons';
import { ExpensesService, ExpensePayload } from '../../core/expenses.service';
import { ProjectsService } from '../../core/projects.service';
import { ReceiptCameraService } from '../../core/receipt-camera.service';
import { resolveAssetUrl } from '../../core/asset-url.util';
import { Expense, Project, SUGGESTED_EXPENSE_CATEGORIES } from '../../core/models';

@Component({
  selector: 'app-expense-form',
  templateUrl: 'expense-form.page.html',
  styleUrls: ['expense-form.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonLabel,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonSpinner,
    IonThumbnail,
  ],
})
export class ExpenseFormPage implements OnInit {
  readonly categories = SUGGESTED_EXPENSE_CATEGORIES;
  readonly projects = signal<Project[]>([]);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly isEdit = signal(false);
  readonly receiptPreviewUrl = signal<string | null>(null);

  expenseId = '';
  description = '';
  amount: number | null = null;
  category = '';
  customCategory = '';
  incurredAtIso = new Date().toISOString();
  projectId = '';
  isReimbursable = false;
  isBillable = false;
  paymentMethod = '';
  notes = '';

  private pendingReceipt: { blob: Blob; fileName: string } | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly expensesService: ExpensesService,
    private readonly projectsService: ProjectsService,
    private readonly receiptCamera: ReceiptCameraService,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
  ) {
    addIcons({ cameraOutline, trashOutline, receiptOutline });
  }

  ngOnInit(): void {
    this.projectsService.list().subscribe((projects) => this.projects.set(projects));

    this.expenseId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.expenseId) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.expensesService.get(this.expenseId).subscribe({
        next: (expense) => {
          this.populateForm(expense);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private populateForm(expense: Expense): void {
    this.description = expense.description;
    this.amount = expense.amount;
    this.incurredAtIso = expense.incurredAt;
    this.projectId = expense.projectId ?? '';
    this.isReimbursable = expense.isReimbursable;
    this.isBillable = expense.isBillable;
    this.paymentMethod = expense.paymentMethod ?? '';
    this.notes = expense.notes ?? '';
    this.receiptPreviewUrl.set(resolveAssetUrl(expense.receiptUrl));

    if (expense.category && this.categories.includes(expense.category)) {
      this.category = expense.category;
    } else if (expense.category) {
      this.category = 'Other';
      this.customCategory = expense.category;
    }
  }

  async captureReceipt(): Promise<void> {
    try {
      const captured = await this.receiptCamera.capture();
      if (!captured) return;
      this.pendingReceipt = { blob: captured.blob, fileName: captured.fileName };
      this.receiptPreviewUrl.set(captured.previewUrl);
    } catch {
      // user cancelled the camera/library prompt — nothing to do
    }
  }

  get resolvedCategory(): string | undefined {
    if (!this.category) return undefined;
    return this.category === 'Other' ? this.customCategory.trim() || undefined : this.category;
  }

  get canSave(): boolean {
    return !!this.description.trim() && !!this.amount && this.amount > 0 && !!this.incurredAtIso;
  }

  async save(): Promise<void> {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);

    const payload: ExpensePayload = {
      description: this.description.trim(),
      amount: Number(this.amount),
      category: this.resolvedCategory,
      incurredAt: this.incurredAtIso,
      projectId: this.projectId || undefined,
      isReimbursable: this.isReimbursable,
      isBillable: this.isBillable,
      paymentMethod: this.paymentMethod.trim() || undefined,
      notes: this.notes.trim() || undefined,
    };

    const save$ = this.isEdit()
      ? this.expensesService.update(this.expenseId, payload)
      : this.expensesService.create(payload);

    save$.subscribe({
      next: (expense) => this.afterSave(expense),
      error: async (err) => {
        this.saving.set(false);
        await this.toast(err?.error?.message ?? 'Could not save the expense.');
      },
    });
  }

  private afterSave(expense: Expense): void {
    if (!this.pendingReceipt) {
      this.saving.set(false);
      this.router.navigateByUrl('/tabs/expenses');
      return;
    }
    this.expensesService
      .uploadReceipt(expense.id, this.pendingReceipt.blob, this.pendingReceipt.fileName)
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigateByUrl('/tabs/expenses');
        },
        error: async (err) => {
          this.saving.set(false);
          await this.toast(
            err?.error?.message ?? 'Expense saved, but the receipt photo failed to upload.',
          );
          this.router.navigateByUrl('/tabs/expenses');
        },
      });
  }

  async deleteExpense(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete expense?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.expensesService.remove(this.expenseId).subscribe(() => {
              this.router.navigateByUrl('/tabs/expenses');
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger' });
    await toast.present();
  }
}
