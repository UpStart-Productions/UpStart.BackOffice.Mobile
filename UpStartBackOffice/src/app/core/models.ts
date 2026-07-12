// Mirrors apps/api/prisma/schema.prisma and the API's select/include shapes
// in UpStart.BackOffice. Keep in sync manually if the backend schema changes.

export type UserRole = 'ADMIN' | 'MEMBER' | 'CLIENT';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'VOID';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  hourlyRate: number | null;
  clientId: string | null;
}

export interface Client {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  notes: string | null;
  category: string | null;
  isActive: boolean;
  portalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  source: 'MANUAL' | 'ASANA';
  isBillable: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  hourlyRate: number | null;
  isBillable: boolean;
  isActive: boolean;
  client?: { id: string; name: string; code: string };
  tasks?: ProjectTask[];
}

export interface TimeEntryProjectRef {
  id: string;
  name: string;
  isBillable: boolean;
  client: { id: string; name: string };
}

export interface TimeEntryTaskRef {
  id: string;
  name: string;
  isBillable: boolean;
  source: 'MANUAL' | 'ASANA';
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  projectTaskId: string | null;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  durationMin: number | null;
  isBillable: boolean;
  hourlyRate: number | null;
  project?: TimeEntryProjectRef;
  projectTask?: TimeEntryTaskRef | null;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  projectId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  project?: { id: string; name: string } | null;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: number;
  displayNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  subtotal: number;
  taxRate: number | null;
  taxAmount: number | null;
  total: number;
  sentAt: string | null;
  paidAt: string | null;
  amountPaid: number | null;
  client?: { id: string; name: string; code: string };
  lineItems?: InvoiceLineItem[];
}
