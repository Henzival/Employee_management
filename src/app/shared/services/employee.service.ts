import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IEmployee, IPosition } from '../interfaces/employee.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:3000/api';

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

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    if (error.status === 401) {
      return throwError(() => new Error('Неавторизованный доступ. Пожалуйста, войдите снова.'));
    } else if (error.status === 400) {
      return throwError(() => new Error(error.error?.error || 'Неверный запрос'));
    } else if (error.status === 500) {
      return throwError(() => new Error('Ошибка сервера. Попробуйте позже.'));
    } else {
      return throwError(() => new Error('Что-то пошло не так. Пожалуйста, попробуйте снова.'));
    }
  }

  public getEmployees(): Observable<IEmployee[]> {
    return this.http.get<IEmployee[]>(`${this.apiUrl}/employees`)
      .pipe(catchError(this.handleError));
  }

  public getEmployeeById(id: number): Observable<IEmployee> {
    return this.http.get<IEmployee>(`${this.apiUrl}/employees/${id}`)
      .pipe(catchError(this.handleError));
  }

  public createEmployee(employee: IEmployee): Observable<IEmployee> {
    console.log('Creating employee:', employee);
    return this.http.post<IEmployee>(`${this.apiUrl}/employees`, employee, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  public updateEmployee(id: number, employee: IEmployee): Observable<IEmployee> {
    console.log('Updating employee:', { id, employee });
    return this.http.put<IEmployee>(`${this.apiUrl}/employees/${id}`, employee, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  public deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/employees/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  public getPositions(): Observable<IPosition[]> {
    return this.http.get<IPosition[]>(`${this.apiUrl}/positions`)
      .pipe(catchError(this.handleError));
  }

  public createPosition(position: IPosition): Observable<IPosition> {
    return this.http.post<IPosition>(`${this.apiUrl}/positions`, position, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  public deletePosition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/positions/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }
}