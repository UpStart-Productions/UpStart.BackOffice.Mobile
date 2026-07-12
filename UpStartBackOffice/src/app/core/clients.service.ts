import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Client } from './models';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  constructor(private readonly api: ApiService) {}

  list(): Observable<Client[]> {
    return this.api.get<Client[]>('/clients');
  }

  get(id: string): Observable<Client> {
    return this.api.get<Client>(`/clients/${id}`);
  }
}
