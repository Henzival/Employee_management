import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IEmployee, IPosition, IAdminUser } from '../interfaces/employee.interface';

interface Database {
  positions: IPosition[];
  employees: IEmployee[];
  admin_users: IAdminUser[];
}

@Injectable({
  providedIn: 'root'
})
export class JsonDatabaseService {
  private dbKey = 'employee_management_db';
  private db: Database;
  private employeesSubject = new BehaviorSubject<IEmployee[]>([]);
  private positionsSubject = new BehaviorSubject<IPosition[]>([]);

  constructor() {
    this.db = this.initializeDatabase();
    this.loadData();
  }

  private initializeDatabase(): Database {
    const defaultData: Database = {
      positions: [
        { id: 1, name: 'Software Developer', created_at: new Date().toISOString() },
        { id: 2, name: 'Project Manager', created_at: new Date().toISOString() },
        { id: 3, name: 'HR Manager', created_at: new Date().toISOString() },
        { id: 4, name: 'QA Engineer', created_at: new Date().toISOString() },
        { id: 5, name: 'DevOps Engineer', created_at: new Date().toISOString() }
      ],
      employees: [],
      admin_users: [
        { 
          id: 1, 
          username: 'admin', 
          password: 'password', // Пароль в открытом виде для демо
          created_at: new Date().toISOString()
        }
      ]
    };

    const stored = localStorage.getItem(this.dbKey);
    if (!stored) {
      localStorage.setItem(this.dbKey, JSON.stringify(defaultData));
      return defaultData;
    }

    return JSON.parse(stored);
  }

  private saveDatabase(): void {
    localStorage.setItem(this.dbKey, JSON.stringify(this.db));
    this.loadData();
  }

  private loadData(): void {
    // Добавляем position_name для сотрудников
    const employeesWithPositionNames = this.db.employees.map(employee => ({
      ...employee,
      position_name: this.db.positions.find(p => p.id === employee.position_id)?.name || ''
    }));
    
    this.employeesSubject.next([...employeesWithPositionNames]);
    this.positionsSubject.next([...this.db.positions]);
  }

  private getNextId(collection: keyof Database): number {
    const items = this.db[collection];
    if (items.length === 0) return 1;
    
    const maxId = Math.max(...items.map(item => item.id || 0));
    return maxId + 1;
  }

  // Employee methods
  getEmployees(): Observable<IEmployee[]> {
    return this.employeesSubject.asObservable();
  }

  getEmployeesSync(): IEmployee[] {
    return this.db.employees.map(employee => ({
      ...employee,
      position_name: this.db.positions.find(p => p.id === employee.position_id)?.name || ''
    }));
  }

  getEmployeeById(id: number): IEmployee | null {
    const employee = this.db.employees.find(e => e.id === id);
    if (!employee) return null;

    return {
      ...employee,
      position_name: this.db.positions.find(p => p.id === employee.position_id)?.name || ''
    };
  }

  createEmployee(employeeData: Omit<IEmployee, 'id' | 'created_at' | 'updated_at' | 'position_name'>): IEmployee {
    // Проверяем, существует ли employee_id
    const existingEmployee = this.db.employees.find(e => e.employee_id === employeeData.employee_id);
    if (existingEmployee) {
      throw new Error('Employee ID already exists');
    }

    const newEmployee: IEmployee = {
      ...employeeData,
      id: this.getNextId('employees'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.db.employees.push(newEmployee);
    this.saveDatabase();
    return this.getEmployeeById(newEmployee.id!)!;
  }

  updateEmployee(id: number, employeeData: Omit<IEmployee, 'id' | 'created_at' | 'updated_at' | 'position_name'>): IEmployee | null {
    const index = this.db.employees.findIndex(e => e.id === id);
    if (index === -1) return null;

    // Проверяем, существует ли employee_id у другого сотрудника
    const duplicateEmployee = this.db.employees.find(
      e => e.employee_id === employeeData.employee_id && e.id !== id
    );
    if (duplicateEmployee) {
      throw new Error('Employee ID already exists');
    }

    const existingEmployee = this.db.employees[index];
    const updatedEmployee: IEmployee = {
      ...employeeData,
      id: existingEmployee.id,
      created_at: existingEmployee.created_at,
      updated_at: new Date().toISOString()
    };

    this.db.employees[index] = updatedEmployee;
    this.saveDatabase();
    return this.getEmployeeById(id)!;
  }

  deleteEmployee(id: number): boolean {
    const index = this.db.employees.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.db.employees.splice(index, 1);
    this.saveDatabase();
    return true;
  }

  // Position methods
  getPositions(): Observable<IPosition[]> {
    return this.positionsSubject.asObservable();
  }

  getPositionsSync(): IPosition[] {
    return [...this.db.positions];
  }

  createPosition(positionData: Omit<IPosition, 'id' | 'created_at'>): IPosition {
    // Проверяем, существует ли должность
    const existingPosition = this.db.positions.find(
      p => p.name.toLowerCase() === positionData.name.toLowerCase()
    );
    if (existingPosition) {
      throw new Error('Position already exists');
    }

    const newPosition: IPosition = {
      ...positionData,
      id: this.getNextId('positions'),
      created_at: new Date().toISOString()
    };

    this.db.positions.push(newPosition);
    this.saveDatabase();
    return newPosition;
  }

  deletePosition(id: number): boolean {
    // Проверяем, используется ли должность сотрудниками
    const employeesUsingPosition = this.db.employees.filter(e => e.position_id === id);
    if (employeesUsingPosition.length > 0) {
      throw new Error('Cannot delete position that is assigned to employees');
    }

    const index = this.db.positions.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.db.positions.splice(index, 1);
    this.saveDatabase();
    return true;
  }

  // Admin methods
  validateAdmin(username: string, password: string): { success: boolean; user?: Omit<IAdminUser, 'password'> } {
    const user = this.db.admin_users.find(u => u.username === username);
    
    if (!user || user.password !== password) {
      return { success: false };
    }

    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  }

  getAdminUsers(): Omit<IAdminUser, 'password'>[] {
    return this.db.admin_users.map(({ password, ...user }) => user);
  }

  createAdminUser(userData: { username: string; password: string }): Omit<IAdminUser, 'password'> {
    const existingUser = this.db.admin_users.find(u => u.username === userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const newAdmin: IAdminUser = {
      id: this.getNextId('admin_users'),
      username: userData.username,
      password: userData.password,
      created_at: new Date().toISOString()
    };

    this.db.admin_users.push(newAdmin);
    this.saveDatabase();

    const { password, ...userWithoutPassword } = newAdmin;
    return userWithoutPassword;
  }

  deleteAdminUser(id: number, currentUserId?: number): boolean {
    if (id === currentUserId) {
      throw new Error('Cannot delete your own account');
    }

    if (id === 1) {
      throw new Error('Cannot delete the primary admin account');
    }

    const index = this.db.admin_users.findIndex(u => u.id === id);
    if (index === -1) return false;

    this.db.admin_users.splice(index, 1);
    this.saveDatabase();
    return true;
  }

  // Вспомогательные методы для отладки
  clearDatabase(): void {
    localStorage.removeItem(this.dbKey);
    this.db = this.initializeDatabase();
    this.loadData();
  }

  exportDatabase(): string {
    return JSON.stringify(this.db, null, 2);
  }

  importDatabase(jsonData: string): void {
    try {
      const importedData = JSON.parse(jsonData) as Database;
      this.db = importedData;
      this.saveDatabase();
    } catch (error) {
      throw new Error('Invalid JSON data');
    }
  }
}