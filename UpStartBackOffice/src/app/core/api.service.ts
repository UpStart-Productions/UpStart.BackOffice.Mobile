import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

function toHttpParams(params?: QueryParams): HttpParams {
  let httpParams = new HttpParams();
  if (!params) return httpParams;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    httpParams = httpParams.set(key, String(value));
  }
  return httpParams;
}

/** Thin wrapper around HttpClient that prefixes the API base URL. Auth
 * headers are attached by the auth interceptor. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { params: toHttpParams(params) });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body ?? {});
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body ?? {});
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`);
  }

  /** For endpoints that return binary content (e.g. invoice PDFs). */
  getBlob(path: string): Observable<Blob> {
    return this.http.get(`${this.base}${path}`, { responseType: 'blob' });
  }

  /** Multipart file upload (e.g. receipt photos). Do not set Content-Type —
   * the browser fills in the multipart boundary automatically for FormData. */
  postFile<T>(path: string, file: Blob, fileName: string, fieldName = 'file'): Observable<T> {
    const form = new FormData();
    form.append(fieldName, file, fileName);
    return this.http.post<T>(`${this.base}${path}`, form);
  }
}
