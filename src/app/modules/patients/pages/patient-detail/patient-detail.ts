import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PatientService } from '../../../../core/services/patient';
import { InvoiceService } from '../../../../core/services/invoice';
import { LoaderService } from '../../../../shared/services/loader';
import { InvoicePrintService } from '../../../../shared/services/invoice-print.service';
import { AddPatientComponent } from '../add-patient/add-patient';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AddPatientComponent],
  templateUrl: './patient-detail.html',
  styleUrls: ['./patient-detail.scss']
})
export class PatientDetailComponent implements OnInit {

  patientCode = '';
  patient: any = null;
  invoices: any[] = [];
  visibleInvoices: any[] = [];
  readonly pageSize = 100;
  invoiceDisplayedCount = 100;
  showPurchaseDialog = false;

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
      this.invoices = (data || []).sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));
      this.resetVisibleInvoices();
      this.loader.hide();
      this.cdr.detectChanges();
    });
  }

  onInvoiceTableScroll(event: Event) {
    const element = event.target as HTMLElement;
    const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 100;
    if (nearBottom) {
      this.loadMoreInvoices();
    }
  }

  // WhatsApp broadcast moved to dedicated page

  loadMoreInvoices() {
    if (this.invoiceDisplayedCount >= this.invoices.length) return;
    this.invoiceDisplayedCount = Math.min(this.invoiceDisplayedCount + this.pageSize, this.invoices.length);
    this.visibleInvoices = this.invoices.slice(0, this.invoiceDisplayedCount);
  }

  private resetVisibleInvoices() {
    this.invoiceDisplayedCount = Math.min(this.pageSize, this.invoices.length);
    this.visibleInvoices = this.invoices.slice(0, this.invoiceDisplayedCount);
  }

  private getLatestDateMs(record: any): number {
    const createdAtMs = record?.createdAt ? new Date(record.createdAt).getTime() : 0;
    const dateMs = record?.date ? new Date(record.date).getTime() : 0;
    return Math.max(createdAtMs || 0, dateMs || 0);
  }

  // WhatsApp broadcast moved to dedicated page

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

  openPurchaseDialog() {
    this.showPurchaseDialog = true;
  }

  closePurchaseDialog() {
    this.showPurchaseDialog = false;
    this.loadInvoices();
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