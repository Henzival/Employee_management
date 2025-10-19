import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdGeneratorService {

  public generateEmployeeId(firstName: string, lastName: string, middleName?: string): string {
    const now = new Date();
    
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const datePart = `${year}${month}${day}`;
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timePart = `${hours}${minutes}${seconds}`;
    
    const firstChar = this.getInitials(firstName, lastName, middleName);
    
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `EMP-${datePart}-${timePart}-${firstChar}-${randomPart}`;
  }

  private getInitials(firstName: string, lastName: string, middleName?: string): string {
    const lastInitial = lastName.charAt(0).toUpperCase();
    const firstInitial = firstName.charAt(0).toUpperCase();
    const middleInitial = middleName ? middleName.charAt(0).toUpperCase() : '';
    
    return middleInitial ? `${lastInitial}${firstInitial}${middleInitial}` : `${lastInitial}${firstInitial}`;
  }

  public generateSimpleEmployeeId(firstName: string, lastName: string, middleName?: string): string {
    const now = new Date();
    const datePart = now.getTime().toString(36);
    const initials = this.getInitials(firstName, lastName, middleName);
    
    return `EMP-${initials}-${datePart}`;
  }

  public isEmployeeIdUnique(employeeId: string, existingIds: string[]): boolean {
    return !existingIds.includes(employeeId);
  }
}