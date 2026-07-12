import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TimeEntry } from './models';

export interface CreateTimeEntryPayload {
  projectId: string;
  projectTaskId?: string;
  description?: string;
  startedAt: string;
  stoppedAt?: string;
  isBillable?: boolean;
  hourlyRate?: number;
}

export interface UpdateTimeEntryPayload {
  projectId?: string;
  projectTaskId?: string | null;
  description?: string;
  startedAt?: string;
  stoppedAt?: string;
  isBillable?: boolean;
  hourlyRate?: number;
}

@Injectable({ providedIn: 'root' })
export class TimeEntriesService {
  constructor(private readonly api: ApiService) {}

  list(params: { userId?: string; projectId?: string; from?: string; to?: string }): Observable<
    TimeEntry[]
  > {
    return this.api.get<TimeEntry[]>('/time-entries', params);
  }

  start(payload: CreateTimeEntryPayload): Observable<TimeEntry> {
    return this.api.post<TimeEntry>('/time-entries', payload);
  }

  stop(id: string): Observable<TimeEntry> {
    return this.api.post<TimeEntry>(`/time-entries/${id}/stop`);
  }

  restart(id: string): Observable<TimeEntry> {
    return this.api.post<TimeEntry>(`/time-entries/${id}/restart`);
  }

  update(id: string, payload: UpdateTimeEntryPayload): Observable<TimeEntry> {
    return this.api.put<TimeEntry>(`/time-entries/${id}`, payload);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/time-entries/${id}`);
  }
}
