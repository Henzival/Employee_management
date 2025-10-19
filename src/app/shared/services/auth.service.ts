import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private isAuthenticated = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  public login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((response: any) => {
          if (response.token) {
            localStorage.setItem('auth_token', response.token);
            this.isAuthenticated.next(true);
          }
        })
      );
  }

  public logout(): void {
    localStorage.removeItem('auth_token');
    this.isAuthenticated.next(false);
  }

  public isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated.asObservable();
  }

  public getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    return token;
  }

  private hasToken(): boolean {
    const hasToken = !!localStorage.getItem('auth_token');
    return hasToken;
  }

  public validateToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid token format');
      this.logout();
      return false;
    }
  }
}