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

  onLogoError(event: any) {
    event.target.style.display = 'none';
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

  handleSMS() {
    const message = `Hi ${this.patient.name}, your invoice ${this.patient.invoiceNumber} for ₹${this.patient.total} has been generated. Thank you for visiting ${this.config.clinic.name}.`;
    const smsUrl = `sms:${this.patient.mobile}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  }

  handleEmail() {
    const subject = `Invoice ${this.patient.invoiceNumber} - ${this.config.clinic.name}`;
    const body = `Dear ${this.patient.name},

Your invoice details:
Invoice Number: ${this.patient.invoiceNumber}
Total Amount: ₹${this.patient.total}
Date: ${new Date(this.patient.date).toLocaleDateString()}

Thank you for visiting ${this.config.clinic.name}.

Regards,
${this.config.clinic.name}`;

    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  }
}
