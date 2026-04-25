import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { PatientService } from '../../../../core/services/patient';
import { InvoiceService } from '../../../../core/services/invoice';
import { InvoiceComponent } from '../../../../shared/components/invoice/invoice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { LoaderService } from '../../../../shared/services/loader';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, InvoiceComponent],
  templateUrl: './patient-detail.html',
  styleUrls: ['./patient-detail.scss']
})
export class PatientDetailComponent implements OnInit {

  patientCode = '';
  patient: any = null;
  invoices: any[] = [];

  selectedInvoice: any = null;

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private loader: LoaderService,
  ) {}

  ngOnInit() {
    this.patientCode = this.route.snapshot.paramMap.get('code') || '';

    this.loadPatient();
    this.loadInvoices();
  }

  loadPatient() {
    this.loader.show();
    this.patientService.getPatients().subscribe((data: any[]) => {
      this.patient = data.find(p => p.patientCode === this.patientCode);
        this.loader.hide();
      this.cdr.detectChanges();
    });
  }

  loadInvoices() {
    this.loader.show();
    this.invoiceService.getInvoicesByPatientCode(this.patientCode).subscribe((data: any[]) => {
      this.invoices = data || [];
      console.log('Invoices:', this.invoices);
      this.loader.hide();
       this.cdr.detectChanges();
    });
  }

  // 🔥 SELECT INVOICE
  selectInvoice(inv: any) {
    this.selectedInvoice = inv;
  }

  // 🖨 PRINT USING COMPONENT
  handlePrint() {
    const element = document.getElementById('invoice-print');

    const win = window.open('', '', 'width=900,height=700');

    win?.document.write(`
      <html>
        <head><title>Invoice</title></head>
        <body>${element?.innerHTML}</body>
      </html>
    `);

    win?.document.close();
    setTimeout(() => win?.print(), 300);
  }

  // 📄 PDF
  async handlePdf() {
    const element = document.getElementById('invoice-print') as HTMLElement;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);

    pdf.save(`Invoice-${this.patient.name}.pdf`);
  }

  // 📱 WHATSAPP
  handleWhatsapp(inv: any) {
    let msg = `🧾 *Clinic Invoice*\n\n`;
    msg += `👤 ${inv.name}\n📱 ${inv.mobile}\n\n`;

    inv.services.forEach((s: any, i: number) => {
      msg += `${i + 1}. ${s.name} - ₹${s.price}\n`;
    });

    msg += `\n💰 Total: ₹${inv.total}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // 🔥 GET SERVICES LIST FOR DISPLAY
  getServicesList(services: any[]): string {
    if (!services || services.length === 0) return '-';
    return services.map(s => s.name).join(', ');
  }

  // 🔥 GET PRODUCTS LIST FOR DISPLAY
  getProductsList(products: any[]): string {
    if (!products || products.length === 0) return '-';
    return products.map(p => p.name).join(', ');
  }
}