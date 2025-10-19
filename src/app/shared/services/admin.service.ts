import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IAdminUser } from '../interfaces/employee.interface';
import { JsonDatabaseService } from './json-database.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(
    private dbService: JsonDatabaseService,
    private authService: AuthService
  ) {}

  private checkAuthentication(): void {
    if (!this.authService.validateToken()) {
      throw new Error('Неавторизованный доступ. Пожалуйста, войдите снова.');
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Admin Service Error:', error);
    return throwError(() => new Error(error.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.'));
  }

  /**
   * Получить список всех администраторов
   */
  public getAdminUsers(): Observable<IAdminUser[]> {
    try {
      this.checkAuthentication();
      const users = this.dbService.getAdminUsers();
      return of(users).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Создать нового администратора
   */
  public createAdminUser(userData: { username: string; password: string }): Observable<IAdminUser> {
    try {
      this.checkAuthentication();
      
      // Проверяем, что пользователь не создает сам себя
      const currentUser = this.authService.getCurrentUserSync();
      if (currentUser && currentUser.username === userData.username) {
        return throwError(() => new Error('Нельзя изменять свой собственный аккаунт'));
      }

      // Валидация данных
      if (!userData.username || !userData.password) {
        return throwError(() => new Error('Имя пользователя и пароль обязательны'));
      }

      if (userData.username.trim().length < 3) {
        return throwError(() => new Error('Имя пользователя должно содержать минимум 3 символа'));
      }

      if (userData.password.length < 4) {
        return throwError(() => new Error('Пароль должен содержать минимум 4 символа'));
      }

      const newUser = this.dbService.createAdminUser(userData);
      return of(newUser).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Удалить администратора
   */
  public deleteAdminUser(id: number): Observable<void> {
    try {
      this.checkAuthentication();
      
      if (!id || id <= 0) {
        return throwError(() => new Error('Неверный идентификатор пользователя'));
      }

      const currentUser = this.authService.getCurrentUserSync();
      const success = this.dbService.deleteAdminUser(id, currentUser?.id);
      
      if (!success) {
        return throwError(() => new Error('Администратор не найден'));
      }
      
      return of(void 0).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Проверить, существует ли имя пользователя
   */
  public checkUsernameExists(username: string): boolean {
    try {
      const users = this.dbService.getAdminUsers();
      return users.some(user => user.username.toLowerCase() === username.toLowerCase());
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  /**
   * Получить текущего пользователя
   */
  public getCurrentAdminUser(): IAdminUser | null {
    return this.authService.getCurrentUserSync();
  }

  /**
   * Изменить пароль текущего пользователя
   */
  public changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    try {
      this.checkAuthentication();

      const currentUser = this.authService.getCurrentUserSync();
      if (!currentUser) {
        return throwError(() => new Error('Пользователь не найден'));
      }

      // Проверяем текущий пароль
      const validation = this.dbService.validateAdmin(currentUser.username, currentPassword);
      if (!validation.success) {
        return throwError(() => new Error('Неверный текущий пароль'));
      }

      // Валидация нового пароля
      if (!newPassword || newPassword.length < 4) {
        return throwError(() => new Error('Новый пароль должен содержать минимум 4 символа'));
      }

      // В реальном приложении здесь был бы вызов к API для смены пароля
      // Для демо просто возвращаем успех
      console.log('Password changed successfully for user:', currentUser.username);
      return of(true).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Получить статистику по администраторам
   */
  public getAdminStats(): Observable<{ total: number; currentUser: IAdminUser | null }> {
    try {
      this.checkAuthentication();
      
      const users = this.dbService.getAdminUsers();
      const currentUser = this.authService.getCurrentUserSync();
      
      return of({
        total: users.length,
        currentUser: currentUser
      }).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}