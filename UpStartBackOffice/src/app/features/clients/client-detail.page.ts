import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
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
  IonIcon,
  IonSpinner,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  callOutline,
  globeOutline,
  locationOutline,
  chevronForwardOutline,
  folderOpenOutline,
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { ClientsService } from '../../core/clients.service';
import { ProjectsService } from '../../core/projects.service';
import { Client, Project } from '../../core/models';

@Component({
  selector: 'app-client-detail',
  templateUrl: 'client-detail.page.html',
  styleUrls: ['client-detail.page.scss'],
  imports: [
    RouterLink,
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
    IonIcon,
    IonSpinner,
    IonBadge,
  ],
})
export class ClientDetailPage implements OnInit {
  readonly client = signal<Client | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  clientId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly clientsService: ClientsService,
    private readonly projectsService: ProjectsService,
  ) {
    addIcons({
      mailOutline,
      callOutline,
      globeOutline,
      locationOutline,
      chevronForwardOutline,
      folderOpenOutline,
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.clientId) return;
    this.loading.set(true);
    forkJoin({
      client: this.clientsService.get(this.clientId),
      projects: this.projectsService.list(this.clientId),
    }).subscribe({
      next: ({ client, projects }) => {
        this.client.set(client);
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addressLine(client: Client): string {
    return [client.city, client.state, client.zip].filter(Boolean).join(', ');
  }
}
