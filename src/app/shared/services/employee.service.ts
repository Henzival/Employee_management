import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IEmployee, IPosition } from '../interfaces/employee.interface';
import { JsonDatabaseService } from './json-database.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

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
    console.error('Employee Service Error:', error);
    const errorMessage = error.message || 'Что-то пошло не так. Пожалуйста, попробуйте снова.';
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Получить список всех сотрудников
   */
  public getEmployees(): Observable<IEmployee[]> {
    return this.dbService.getEmployees().pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Получить сотрудника по ID
   */
  public getEmployeeById(id: number): Observable<IEmployee> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Неверный идентификатор сотрудника'));
    }

    const employee = this.dbService.getEmployeeById(id);
    if (!employee) {
      return throwError(() => new Error('Сотрудник не найден'));
    }

    return of(employee).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Создать нового сотрудника
   */
  public createEmployee(employeeData: Omit<IEmployee, 'id' | 'created_at' | 'updated_at' | 'position_name'>): Observable<IEmployee> {
    try {
      this.checkAuthentication();
      console.log('Creating employee:', employeeData);

      // Валидация обязательных полей
      if (!employeeData.employee_id || !employeeData.first_name || !employeeData.last_name) {
        return throwError(() => new Error('ID сотрудника, имя и фамилия обязательны для заполнения'));
      }

      if (typeof employeeData.employee_id !== 'string' || employeeData.employee_id.trim() === '') {
        return throwError(() => new Error('ID сотрудника должен быть непустой строкой'));
      }

      if (typeof employeeData.first_name !== 'string' || employeeData.first_name.trim() === '') {
        return throwError(() => new Error('Имя должно быть непустой строкой'));
      }

      if (typeof employeeData.last_name !== 'string' || employeeData.last_name.trim() === '') {
        return throwError(() => new Error('Фамилия должна быть непустой строкой'));
      }

      // Валидация email
      if (employeeData.contact_email && !this.isValidEmail(employeeData.contact_email)) {
        return throwError(() => new Error('Неверный формат email'));
      }

      // Валидация зарплаты
      if (employeeData.salary && employeeData.salary < 0) {
        return throwError(() => new Error('Зарплата не может быть отрицательной'));
      }

      const newEmployee = this.dbService.createEmployee(employeeData);
      return of(newEmployee).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Обновить данные сотрудника
   */
  public updateEmployee(id: number, employeeData: Omit<IEmployee, 'id' | 'created_at' | 'updated_at' | 'position_name'>): Observable<IEmployee> {
    try {
      this.checkAuthentication();
      console.log('Updating employee:', { id, employeeData });

      if (!id || id <= 0) {
        return throwError(() => new Error('Неверный идентификатор сотрудника'));
      }

      // Валидация обязательных полей
      if (!employeeData.employee_id || !employeeData.first_name || !employeeData.last_name) {
        return throwError(() => new Error('ID сотрудника, имя и фамилия обязательны для заполнения'));
      }

      if (typeof employeeData.employee_id !== 'string' || employeeData.employee_id.trim() === '') {
        return throwError(() => new Error('ID сотрудника должен быть непустой строкой'));
      }

      // Валидация email
      if (employeeData.contact_email && !this.isValidEmail(employeeData.contact_email)) {
        return throwError(() => new Error('Неверный формат email'));
      }

      // Валидация зарплаты
      if (employeeData.salary && employeeData.salary < 0) {
        return throwError(() => new Error('Зарплата не может быть отрицательной'));
      }

      const updatedEmployee = this.dbService.updateEmployee(id, employeeData);
      if (!updatedEmployee) {
        return throwError(() => new Error('Сотрудник не найден'));
      }

      return of(updatedEmployee).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Удалить сотрудника
   */
  public deleteEmployee(id: number): Observable<void> {
    try {
      this.checkAuthentication();

      if (!id || id <= 0) {
        return throwError(() => new Error('Неверный идентификатор сотрудника'));
      }

      const success = this.dbService.deleteEmployee(id);
      if (!success) {
        return throwError(() => new Error('Сотрудник не найден'));
      }

      return of(void 0).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Получить список всех должностей
   */
  public getPositions(): Observable<IPosition[]> {
    return this.dbService.getPositions().pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Создать новую должность
   */
  public createPosition(positionData: Omit<IPosition, 'id' | 'created_at'>): Observable<IPosition> {
    try {
      this.checkAuthentication();

      if (!positionData.name || typeof positionData.name !== 'string' || positionData.name.trim() === '') {
        return throwError(() => new Error('Название должности обязательно для заполнения'));
      }

      if (positionData.name.trim().length < 2) {
        return throwError(() => new Error('Название должности должно содержать минимум 2 символа'));
      }

      const newPosition = this.dbService.createPosition(positionData);
      return of(newPosition).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Удалить должность
   */
  public deletePosition(id: number): Observable<void> {
    try {
      this.checkAuthentication();

      if (!id || id <= 0) {
        return throwError(() => new Error('Неверный идентификатор должности'));
      }

      const success = this.dbService.deletePosition(id);
      if (!success) {
        return throwError(() => new Error('Должность не найдена'));
      }

      return of(void 0).pipe(
        catchError(this.handleError)
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Поиск сотрудников по имени или фамилии
   */
  public searchEmployees(query: string): Observable<IEmployee[]> {
    if (!query || query.trim() === '') {
      return this.getEmployees();
    }

    const searchTerm = query.toLowerCase().trim();
    
    return this.getEmployees().pipe(
      map(employees => employees.filter(employee =>
        employee.first_name.toLowerCase().includes(searchTerm) ||
        employee.last_name.toLowerCase().includes(searchTerm) ||
        employee.employee_id.toLowerCase().includes(searchTerm) ||
        (employee.middle_name && employee.middle_name.toLowerCase().includes(searchTerm))
      )),
      catchError(this.handleError)
    );
  }

  /**
   * Получить сотрудников по должности
   */
  public getEmployeesByPosition(positionId: number): Observable<IEmployee[]> {
    if (!positionId || positionId <= 0) {
      return throwError(() => new Error('Неверный идентификатор должности'));
    }

    return this.getEmployees().pipe(
      map(employees => employees.filter(employee => employee.position_id === positionId)),
      catchError(this.handleError)
    );
  }

  /**
   * Получить статистику по сотрудникам
   */
  public getEmployeeStats(): Observable<{
    total: number;
    byPosition: { [positionName: string]: number };
    averageSalary: number;
  }> {
    return this.getEmployees().pipe(
      map(employees => {
        const total = employees.length;
        
        const byPosition: { [positionName: string]: number } = {};
        employees.forEach(employee => {
          const positionName = employee.position_name || 'Не указана';
          byPosition[positionName] = (byPosition[positionName] || 0) + 1;
        });

        const salaries = employees
          .filter(emp => emp.salary && emp.salary > 0)
          .map(emp => emp.salary) as number[];
        
        const averageSalary = salaries.length > 0 
          ? salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length 
          : 0;

        return {
          total,
          byPosition,
          averageSalary: Math.round(averageSalary * 100) / 100
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Проверить, существует ли employee_id
   */
  public checkEmployeeIdExists(employeeId: string, excludeId?: number): boolean {
    try {
      const employees = this.dbService.getEmployeesSync();
      return employees.some(employee => 
        employee.employee_id === employeeId && 
        employee.id !== excludeId
      );
    } catch (error) {
      console.error('Error checking employee ID:', error);
      return false;
    }
  }

  /**
   * Валидация email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Получить сотрудников с высокой зарплатой
   */
  public getHighSalaryEmployees(threshold: number = 50000): Observable<IEmployee[]> {
    return this.getEmployees().pipe(
      map(employees => employees.filter(employee => 
        employee.salary && employee.salary >= threshold
      ).sort((a, b) => (b.salary || 0) - (a.salary || 0))),
      catchError(this.handleError)
    );
  }

  /**
   * Экспорт данных сотрудников в CSV формат
   */
  public exportToCsv(): Observable<string> {
    return this.getEmployees().pipe(
      map(employees => {
        if (employees.length === 0) {
          throw new Error('Нет данных для экспорта');
        }

        const headers = ['ID', 'Employee ID', 'First Name', 'Last Name', 'Position', 'Email', 'Phone', 'Salary'];
        const csvRows = [headers.join(',')];

        employees.forEach(employee => {
          const row = [
            employee.id,
            `"${employee.employee_id}"`,
            `"${employee.first_name}"`,
            `"${employee.last_name}"`,
            `"${employee.position_name || ''}"`,
            `"${employee.contact_email || ''}"`,
            `"${employee.contact_phone || ''}"`,
            employee.salary || 0
          ];
          csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
      }),
      catchError(this.handleError)
    );
  }
}