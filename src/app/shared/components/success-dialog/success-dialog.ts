import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicePrintService } from '../../services/invoice-print.service';
import { ConfigService } from '../../../core/config/clinic.service';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-dialog.html',
  styleUrls: ['./success-dialog.scss']
})
export class SuccessDialogComponent {

  @Input() patient: any;
  @Output() close = new EventEmitter();

  constructor(
    public config: ConfigService,
    private invoicePrint: InvoicePrintService
  ) {}
  
  onClose() {
    this.close.emit();
  }

  handlePreview() {
    this.invoicePrint.previewInvoice(this.patient, `Invoice-${this.patient?.name || 'Invoice'}`);
  }

  handlePrint() {
    this.invoicePrint.printInvoice(this.patient, `Invoice-${this.patient?.name || 'Invoice'}`);
  }

  async handlePdf() {
    await this.invoicePrint.downloadInvoice(this.patient, `Invoice-${this.patient?.name || 'Invoice'}.pdf`);
  }

  handleWhatsapp() {
    this.invoicePrint.shareWhatsApp(this.patient);
  }
}
