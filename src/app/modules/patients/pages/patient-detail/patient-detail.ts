import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { PatientService } from '../../../../core/services/patient';
import { InvoiceService } from '../../../../core/services/invoice';
import { LoaderService } from '../../../../shared/services/loader';
import { InvoicePrintService } from '../../../../shared/services/invoice-print.service';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-detail.html',
  styleUrls: ['./patient-detail.scss']
})
export class PatientDetailComponent implements OnInit {

  patientCode = '';
  patient: any = null;
  invoices: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private invoiceService: InvoiceService,
    private invoicePrint: InvoicePrintService,
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
      this.loader.hide();
       this.cdr.detectChanges();
    });
  }

  // 🔥 SELECT INVOICE
  // 🔥 SELECT INVOICE THEN PRINT
  previewInvoice(inv: any) {
    this.invoicePrint.previewInvoice(inv, `Invoice-${inv.name || 'Invoice'}`);
  }

  printInvoice(inv: any) {
    this.invoicePrint.printInvoice(inv, `Invoice-${inv.name || 'Invoice'}`);
  }

  // 🔥 SELECT INVOICE THEN DOWNLOAD PDF
  async downloadInvoice(inv: any) {
    await this.invoicePrint.downloadInvoice(inv, `Invoice-${inv.name || 'Invoice'}.pdf`);
  }

  // 📱 WHATSAPP
  handleWhatsapp(inv: any) {
    this.invoicePrint.shareWhatsApp(inv);
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