import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PatientService } from '../../../../core/services/patient';
import { InvoiceService } from '../../../../core/services/invoice';
import { LoaderService } from '../../../../shared/services/loader';
import { InvoicePrintService } from '../../../../shared/services/invoice-print.service';
import { CLINIC_CONFIG } from '../../../../core/config/clinic.config';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-detail.html',
  styleUrls: ['./patient-detail.scss']
})
export class PatientDetailComponent implements OnInit {

  patientCode = '';
  patient: any = null;
  invoices: any[] = [];
  patients: any[] = [];
  selectedPatientIds = new Set<string>();
  broadcastMessage = `Hello from ${CLINIC_CONFIG.name}.\nPlease note: attach the invoice manually in WhatsApp if needed.`;
  broadcastImageName = '';
  activeTab: 'invoices' | 'whatsapp' = 'invoices';

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
    this.loadPatients();
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

  loadPatients() {
    this.loader.show();
    this.patientService.getPatients().subscribe((data: any[]) => {
      this.patients = (data || []).map(patient => ({
        ...patient,
        mobile: patient.mobile || ''
      }));
      this.selectedPatientIds = new Set(this.patients.filter(p => p.mobile).map(p => p.id));
      this.loader.hide();
      this.cdr.detectChanges();
    });
  }

  togglePatientSelection(patientId: string, selected: boolean) {
    if (selected) {
      this.selectedPatientIds.add(patientId);
    } else {
      this.selectedPatientIds.delete(patientId);
    }
  }

  toggleSelectAll(select: boolean) {
    if (select) {
      this.selectedPatientIds = new Set(this.patients.filter(p => p.mobile).map(p => p.id));
    } else {
      this.selectedPatientIds.clear();
    }
  }

  handleBroadcastImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.broadcastImageName = file ? file.name : '';
  }

  async copyBroadcastMessage() {
    try {
      await navigator.clipboard.writeText(this.broadcastMessage || '');
      alert('Message copied to clipboard. Paste it in WhatsApp.');
    } catch {
      alert('Please copy the message manually.');
    }
  }

  openWhatsAppBroadcast() {
    const selectedPatients = this.patients.filter(p => this.selectedPatientIds.has(p.id) && p.mobile);
    if (!selectedPatients.length) {
      alert('Select at least one patient with a valid mobile number.');
      return;
    }

    const numbers = selectedPatients.map(p => p.mobile.replace(/\D/g, '')).filter(Boolean);
    const message = this.broadcastMessage.trim() || `Hello from ${CLINIC_CONFIG.name}.`;
    const url = numbers.length === 1
      ? `https://wa.me/${numbers[0]}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  }

  get selectedPatientsCount() {
    return this.selectedPatientIds.size;
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