import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'time',
        loadComponent: () => import('../features/time/time.page').then((m) => m.TimePage),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('../features/clients/clients-list.page').then((m) => m.ClientsListPage),
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('../features/clients/client-detail.page').then((m) => m.ClientDetailPage),
      },
      {
        path: 'clients/:id/projects/:projectId',
        loadComponent: () =>
          import('../features/clients/project-detail.page').then((m) => m.ProjectDetailPage),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('../features/invoices/invoices-list.page').then((m) => m.InvoicesListPage),
      },
      {
        path: 'invoices/:id',
        loadComponent: () =>
          import('../features/invoices/invoice-detail.page').then((m) => m.InvoiceDetailPage),
      },
      {
        path: 'invoices/:id/pdf',
        loadComponent: () =>
          import('../features/invoices/invoice-pdf.page').then((m) => m.InvoicePdfPage),
      },
      {
        path: 'account',
        loadComponent: () => import('../features/account/account.page').then((m) => m.AccountPage),
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full',
  },
];
