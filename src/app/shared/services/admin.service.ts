import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface IAdminUser {
  id?: number;
  username: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  public getAdminUsers(): Observable<IAdminUser[]> {
    return this.http.get<IAdminUser[]>(`${this.apiUrl}/users`, { 
      headers: this.getHeaders() 
    });
  }

  public createAdminUser(user: { username: string; password: string }): Observable<IAdminUser> {
    return this.http.post<IAdminUser>(`${this.apiUrl}/users`, user, { 
      headers: this.getHeaders() 
    });
  }

  public deleteAdminUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`, { 
      headers: this.getHeaders() 
    });
  }
}