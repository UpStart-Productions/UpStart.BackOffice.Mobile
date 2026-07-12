import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, chevronForwardOutline, flashOutline } from 'ionicons/icons';
import { ClientsService } from '../../core/clients.service';
import { Client } from '../../core/models';
import { QuickActionsService } from '../../core/quick-actions.service';

@Component({
  selector: 'app-clients-list',
  templateUrl: 'clients-list.page.html',
  styleUrls: ['clients-list.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton,
  ],
})
export class ClientsListPage implements OnInit {
  readonly clients = signal<Client[]>([]);
  readonly loading = signal(false);
  query = '';

  readonly filteredClients = computed(() => {
    const q = this.query.trim().toLowerCase();
    const list = this.clients();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    );
  });

  constructor(
    private readonly clientsService: ClientsService,
    private readonly quickActions: QuickActionsService,
  ) {
    addIcons({ businessOutline, chevronForwardOutline, flashOutline });
  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: { target: { complete: () => void } }): void {
    this.loading.set(true);
    this.clientsService.list().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
        event?.target.complete();
      },
      error: () => {
        this.loading.set(false);
        event?.target.complete();
      },
    });
  }

  openQuickActions(): void {
    this.quickActions.present();
  }
}
