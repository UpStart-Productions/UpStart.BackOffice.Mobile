import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, timeOutline, playOutline } from 'ionicons/icons';
import { ProjectsService } from '../../core/projects.service';
import { Project } from '../../core/models';

@Component({
  selector: 'app-project-detail',
  templateUrl: 'project-detail.page.html',
  styleUrls: ['project-detail.page.scss'],
  imports: [
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
    IonButton,
  ],
})
export class ProjectDetailPage implements OnInit {
  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);
  clientId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly projectsService: ProjectsService,
  ) {
    addIcons({ checkmarkCircleOutline, timeOutline, playOutline });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') ?? '';
    const projectId = this.route.snapshot.paramMap.get('projectId') ?? '';
    if (!projectId) return;
    this.loading.set(true);
    this.projectsService.get(projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  logTime(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/tabs/time'], { queryParams: { projectId: project.id } });
  }
}
