import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PatientService } from '../../../../core/services/patient';
import { InvoiceService } from '../../../../core/services/invoice';
import { LoaderService } from '../../../../shared/services/loader';
import { InvoicePrintService } from '../../../../shared/services/invoice-print.service';
import { AddPatientComponent } from '../add-patient/add-patient';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AddPatientComponent],
  templateUrl: './patient-detail.html',
  styleUrls: ['./patient-detail.scss']
})
export class PatientDetailComponent implements OnInit, OnDestroy {

  patientCode = '';
  patient: any = null;
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  visibleInvoices: any[] = [];
  readonly pageSize = 100;
  invoiceDisplayedCount = 100;
  showPurchaseDialog = false;
  invoiceSearch = '';
  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private invoiceService: InvoiceService,
    private invoicePrint: InvoicePrintService,
    private cdr: ChangeDetectorRef,
    private loader: LoaderService,
  ) {}

  ngOnInit() {
    this.sub.add(
      this.route.paramMap.subscribe(params => {
        this.patientCode = params.get('code') || '';
        this.patient = null;
        this.invoices = [];
        this.visibleInvoices = [];
        this.loadPatient();
        this.loadInvoices();
      })
    );
  }

  loadPatient() {
    this.loader.show();
    const s = this.patientService.getPatients().subscribe((data: any[]) => {
      this.patient = data.find(p => p.patientCode === this.patientCode);
      this.loader.hide();
      this.cdr.detectChanges();
    });
    this.sub.add(s);
  }

  loadInvoices() {
    if (!this.patientCode) return;

    // Use a single query and filter client-side (reliable on hard refresh).
    this.loader.show();
    const s = this.invoiceService.getAllInvoices().subscribe((all: any[]) => {
      const filtered = (all || []).filter(inv => inv?.patientCode === this.patientCode);
      this.invoices = filtered.sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));
      this.applyInvoiceFilter();
      this.loader.hide();
      this.cdr.detectChanges();
    });
    this.sub.add(s);
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
    if (this.invoiceDisplayedCount >= this.filteredInvoices.length) return;
    this.invoiceDisplayedCount = Math.min(this.invoiceDisplayedCount + this.pageSize, this.filteredInvoices.length);
    this.visibleInvoices = this.filteredInvoices.slice(0, this.invoiceDisplayedCount);
  }

  private resetVisibleInvoices() {
    this.invoiceDisplayedCount = Math.min(this.pageSize, this.filteredInvoices.length);
    this.visibleInvoices = this.filteredInvoices.slice(0, this.invoiceDisplayedCount);
  }

  applyInvoiceFilter() {
    const term = (this.invoiceSearch || '').trim().toLowerCase();
    if (!term) {
      this.filteredInvoices = [...this.invoices];
      this.resetVisibleInvoices();
      return;
    }

    const includes = (v: any) => String(v ?? '').toLowerCase().includes(term);
    this.filteredInvoices = this.invoices.filter(inv => {
      const services = (inv?.services || []).map((s: any) => s?.name).join(', ');
      const products = (inv?.products || []).map((p: any) => p?.name).join(', ');
      return (
        includes(inv?.invoiceNumber) ||
        includes(inv?.paymentMode) ||
        includes(inv?.total) ||
        includes(inv?.createdAt) ||
        includes(inv?.date) ||
        includes(services) ||
        includes(products)
      );
    });

    this.filteredInvoices.sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));
    this.resetVisibleInvoices();
  }

  private getLatestDateMs(record: any): number {
    const createdAtMs = record?.createdAt ? new Date(record.createdAt).getTime() : 0;
    const dateMs = record?.date ? new Date(record.date).getTime() : 0;
    return Math.max(createdAtMs || 0, dateMs || 0);
  }

  // WhatsApp broadcast moved to dedicated page

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

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}