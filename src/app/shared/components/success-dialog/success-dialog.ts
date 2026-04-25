import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceComponent } from '../invoice/invoice';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConfigService } from '../../../core/config/clinic.service';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule, InvoiceComponent],
  templateUrl: './success-dialog.html',
  styleUrls: ['./success-dialog.scss']
})
export class SuccessDialogComponent {

  @Input() patient: any;
  @Output() close = new EventEmitter();

  constructor(public config: ConfigService) {}
  
  onClose() {
    this.close.emit();
  }

  // 🖨 PRINT
  handlePrint() {
  const element = document.getElementById('invoice-container');

  const win = window.open('', '', 'width=900,height=700');

  win?.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <style>
          body { margin:0; }
        </style>
      </head>
      <body>
        ${element?.innerHTML}
      </body>
    </html>
  `);

  win?.document.close();
  setTimeout(() => win?.print(), 300);
}

  // 📄 PDF DOWNLOAD
 async handlePdf() {
  const element = document.getElementById('invoice-container') as HTMLElement;

  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');

  const width = 190;
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, 'PNG', 10, 10, width, height);
  pdf.save(`Invoice-${this.patient.name}.pdf`);
}


  // 📱 WHATSAPP
 handleWhatsapp() {

  let msg = `🧾 *Clinic Invoice*\n\n`;
  msg += `👤 ${this.patient.name}\n📱 ${this.patient.mobile}\n\n`;

  this.patient.services.forEach((s: any, i: number) => {
    msg += `${i + 1}. ${s.name} - ₹${s.price}\n`;
  });

  msg += `\n💰 Total: ₹${this.patient.total}`;
  msg += `\n\n📎 Please attach PDF from download`;

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

}