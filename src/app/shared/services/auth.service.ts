import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IAdminUser } from '../interfaces/employee.interface';
import { JsonDatabaseService } from './json-database.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = new BehaviorSubject<boolean>(this.hasToken());
  private currentUser = new BehaviorSubject<IAdminUser | null>(this.getStoredUser());
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(private dbService: JsonDatabaseService) {}

  /**
   * Вход в систему
   */
  public login(username: string, password: string): { success: boolean; error?: string; user?: IAdminUser } {
    try {
      // Валидация входных данных
      if (!username || !password) {
        return { success: false, error: 'Имя пользователя и пароль обязательны' };
      }

      if (username.trim().length < 3) {
        return { success: false, error: 'Имя пользователя должно содержать минимум 3 символа' };
      }

      const result = this.dbService.validateAdmin(username.trim(), password);
      
      if (result.success && result.user) {
        // Создаем простой "токен" (в реальном приложении нужно использовать JWT)
        const tokenData = {
          id: result.user.id,
          username: result.user.username,
          exp: Date.now() + (24 * 60 * 60 * 1000) // 24 часа
        };

        const token = btoa(JSON.stringify(tokenData));
        
        // Сохраняем в localStorage
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(result.user));
        
        // Обновляем состояния
        this.isAuthenticated.next(true);
        this.currentUser.next(result.user);
        
        console.log('Успешный вход пользователя:', result.user.username);
        return { success: true, user: result.user };
      }

      return { success: false, error: 'Неверное имя пользователя или пароль' };
    } catch (error) {
      console.error('Ошибка входа:', error);
      return { success: false, error: 'Произошла ошибка при входе в систему' };
    }
  }

  /**
   * Выход из системы
   */
  public logout(): void {
    const username = this.currentUser.value?.username;
    
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticated.next(false);
    this.currentUser.next(null);
    
    console.log('Пользователь вышел из системы:', username);
  }

  /**
   * Проверка статуса аутентификации
   */
  public isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated.asObservable();
  }

  /**
   * Получение текущего пользователя
   */
  public getCurrentUser(): Observable<IAdminUser | null> {
    return this.currentUser.asObservable();
  }

  /**
   * Получение текущего пользователя (синхронно)
   */
  public getCurrentUserSync(): IAdminUser | null {
    return this.currentUser.value;
  }

  /**
   * Получение токена
   */
  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Проверка валидности токена
   */
  public validateToken(): boolean {
    return this.hasToken();
  }

  /**
   * Проверка прав администратора
   */
  public isAdmin(): boolean {
    return this.hasToken() && !!this.currentUser.value;
  }

  /**
   * Получение имени текущего пользователя
   */
  public getUsername(): string | null {
    return this.currentUser.value?.username || null;
  }

  /**
   * Получение ID текущего пользователя
   */
  public getUserId(): number | null {
    return this.currentUser.value?.id || null;
  }

  /**
   * Обновление данных пользователя
   */
  public updateUserData(user: IAdminUser): void {
    if (this.currentUser.value?.id === user.id) {
      this.currentUser.next(user);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  /**
   * Проверка, истек ли срок действия токена
   */
  public isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token));
      return payload.exp < Date.now();
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      return true;
    }
  }

  /**
   * Автоматический вход при наличии валидного токена
   */
  public autoLogin(): boolean {
    if (this.hasToken() && !this.isTokenExpired()) {
      const user = this.getStoredUser();
      if (user) {
        this.currentUser.next(user);
        this.isAuthenticated.next(true);
        console.log('Автоматический вход пользователя:', user.username);
        return true;
      }
    }
    return false;
  }

  /**
   * Очистка данных аутентификации
   */
  public clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticated.next(false);
    this.currentUser.next(null);
  }

  /**
   * Проверка наличия токена
   */
  private hasToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token));
      const isExpired = payload.exp < Date.now();
      
      if (isExpired) {
        this.clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Неверный формат токена:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Получение пользователя из localStorage
   */
  private getStoredUser(): IAdminUser | null {
    try {
      const userStr = localStorage.getItem(this.userKey);
      if (!userStr) return null;

      const user = JSON.parse(userStr) as IAdminUser;
      return user;
    } catch (error) {
      console.error('Ошибка чтения пользователя из localStorage:', error);
      return null;
    }
  }

  /**
   * Создание тестового администратора (для разработки)
   */
  public createTestAdmin(): void {
    const testAdmin = {
      username: 'test',
      password: 'test123'
    };

    try {
      this.dbService.createAdminUser(testAdmin);
      console.log('Тестовый администратор создан:', testAdmin.username);
    } catch (error) {
      console.log('Тестовый администратор уже существует');
    }
  }

  /**
   * Получение информации о сессии
   */
  public getSessionInfo(): { 
    isAuthenticated: boolean; 
    user: IAdminUser | null; 
    tokenExists: boolean;
    tokenValid: boolean;
  } {
    return {
      isAuthenticated: this.isAuthenticated.value,
      user: this.currentUser.value,
      tokenExists: !!this.getToken(),
      tokenValid: this.validateToken()
    };
  }
}