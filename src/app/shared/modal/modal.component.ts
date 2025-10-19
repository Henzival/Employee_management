import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalConfig, ModalResult } from '../services/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() config!: ModalConfig;
  @Output() closed = new EventEmitter<ModalResult>();
  
  inputValue: string = '';

  ngOnInit(): void {
    this.inputValue = this.config.inputValue || '';
  }

  public confirm(): void {
    this.closed.emit({
      confirmed: true,
      value: this.inputValue
    });
  }

  public cancel(): void {
    this.closed.emit({
      confirmed: false,
      value: this.inputValue
    });
  }

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }

  public onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancel();
    }
  }
}