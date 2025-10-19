import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'alert' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  inputValue?: string;
}

export interface ModalResult {
  confirmed: boolean;
  value?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<{config: ModalConfig, callback: (result: ModalResult) => void} | null>(null);
  
  public showAlert(title: string, message: string): Observable<void> {
    return new Observable(observer => {
      this.modalSubject.next({
        config: {
          title,
          message,
          type: 'alert',
          confirmText: 'OK'
        },
        callback: (result) => {
          observer.next();
          observer.complete();
        }
      });
    });
  }

  public showConfirm(title: string, message: string, confirmText: string = 'Да', cancelText: string = 'Отмена'): Observable<boolean> {
    return new Observable(observer => {
      this.modalSubject.next({
        config: {
          title,
          message,
          type: 'confirm',
          confirmText,
          cancelText
        },
        callback: (result) => {
          observer.next(result.confirmed);
          observer.complete();
        }
      });
    });
  }

  public getModal(): Observable<{config: ModalConfig, callback: (result: ModalResult) => void} | null> {
    return this.modalSubject.asObservable();
  }

  public closeModal(result: ModalResult): void {
    this.modalSubject.next(null);
  }
}