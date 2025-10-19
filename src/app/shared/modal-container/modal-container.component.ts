import { Component } from '@angular/core';
import { ModalService } from '../services/modal.service';
import { ModalConfig, ModalResult } from '../services/modal.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-modal-container',
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.scss']
})
export class ModalContainerComponent {
  currentModal: {config: ModalConfig, callback: (result: ModalResult) => void} | null = null;

  constructor(private modalService: ModalService) {
    this.modalService.getModal().pipe(untilDestroyed(this)).subscribe(modal => {
      this.currentModal = modal;
    });
  }

  public onModalClosed(result: ModalResult): void {
    if (this.currentModal) {
      this.currentModal.callback(result);
      this.modalService.closeModal(result);
    }
  }
}