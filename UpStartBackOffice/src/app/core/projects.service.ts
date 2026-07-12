import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Project } from './models';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private readonly api: ApiService) {}

  list(clientId?: string): Observable<Project[]> {
    return this.api.get<Project[]>('/projects', { clientId });
  }

  get(id: string): Observable<Project> {
    return this.api.get<Project>(`/projects/${id}`);
  }
}
