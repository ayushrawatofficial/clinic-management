import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';

import { ServiceService } from '../../../../core/services/service';
import { RepairService } from '../../../../core/services/repair';
import { InvoiceService } from '../../../../core/services/invoice';
import { LoaderService } from '../../../../shared/services/loader';
import { ToastService } from '../../../../shared/services/toast';
import { isRepairServiceCategory } from '../../../../shared/constants/repair';
import { InvoicePrintService } from '../../../../shared/services/invoice-print.service';

@Component({
  selector: 'app-repairing-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './repairing-list.html',
  styleUrls: ['./repairing-list.scss']
})
export class RepairingListComponent implements OnInit, OnDestroy {

  repairServices: any[] = [];
  allJobs: any[] = [];
  search = '';

  showInwardDialog = false;
  showInvoicePreview = false;
  previewJob: any = null;

  saving = false;

  inwardForm = {
    serviceId: '',
    warrantyType: 'warranty' as 'warranty' | 'outside_warranty',
    issue: '',
    purchasedDate: '',
    model: '',
    serial: '',
    expectedDeliveryDate: '',
    customerName: '',
    customerMobile: '',
    paymentMode: '' as '' | 'cash' | 'card' | 'upi',
    inwardDate: ''
  };

  private sub?: Subscription;

  constructor(
    private serviceService: ServiceService,
    private repairService: RepairService,
    private invoiceService: InvoiceService,
    private invoicePrint: InvoicePrintService,
    private loader: LoaderService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inwardForm.inwardDate = new Date().toISOString().slice(0, 10);
    this.sub = combineLatest([
      this.serviceService.getServices(),
      this.repairService.getRepairJobs()
    ]).subscribe(([services, jobs]) => {
      this.repairServices = (services || [])
        .filter(s => isRepairServiceCategory(s.category))
        .sort((a, b) => this.getSvcTime(b) - this.getSvcTime(a));
      this.allJobs = (jobs || []).slice().sort((a, b) => this.jobSortMs(b) - this.jobSortMs(a));
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get filteredJobs(): any[] {
    const q = (this.search || '').trim().toLowerCase();
    if (!q) return this.allJobs;
    return this.allJobs.filter(j => {
      const blob = [
        j.inwardInvoiceNumber,
        j.serviceName,
        j.issue,
        j.model,
        j.serial,
        j.customerName,
        j.customerMobile,
        j.status
      ].map(x => String(x ?? '').toLowerCase()).join(' ');
      return blob.includes(q);
    });
  }

  get kpis() {
    const now = new Date();
    const inShop = this.allJobs.filter(j => j.status === 'inward').length;
    const outThisMonth = this.allJobs.filter(j => {
      if (!j.outwardDate) return false;
      const d = new Date(j.outwardDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const inwardThisMonth = this.allJobs.filter(j => {
      const d = new Date(j.inwardDate || j.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { inShop, outThisMonth, inwardThisMonth };
  }

  openInward(): void {
    this.resetForm();
    this.showInwardDialog = true;
  }

  closeInward(): void {
    if (!this.saving) {
      this.showInwardDialog = false;
    }
  }

  private resetForm(): void {
    this.inwardForm = {
      serviceId: '',
      warrantyType: 'warranty',
      issue: '',
      purchasedDate: '',
      model: '',
      serial: '',
      expectedDeliveryDate: '',
      customerName: '',
      customerMobile: '',
      paymentMode: '',
      inwardDate: new Date().toISOString().slice(0, 10)
    };
  }

  selectedService(): any | null {
    return this.repairServices.find(s => s.id === this.inwardForm.serviceId) || null;
  }

  lineTotal(): number {
    const svc = this.selectedService();
    if (!svc) return 0;
    const n = Number(svc.finalPrice ?? svc.price ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  validateInward(): string | null {
    if (!this.inwardForm.serviceId) return 'Select a repair service / tariff';
    if (!this.inwardForm.issue?.trim()) return 'Describe the issue';
    if (!this.inwardForm.model?.trim()) return 'Model is required';
    if (!this.inwardForm.serial?.trim()) return 'Serial number is required';
    if (!this.inwardForm.expectedDeliveryDate) return 'Expected delivery date is required';
    if (!this.inwardForm.inwardDate) return 'Inward date is required';
    if (!this.inwardForm.paymentMode) return 'Payment mode is required';
    const mobile = (this.inwardForm.customerMobile || '').replace(/\D/g, '');
    if (mobile && mobile.length !== 10) return 'Mobile must be 10 digits';
    return null;
  }

  async submitInward(): Promise<void> {
    const err = this.validateInward();
    if (err) {
      this.toast.show(err, 'error');
      return;
    }
    const svc = this.selectedService()!;
    const total = this.lineTotal();
    const inwardNumber = `REP-IN-${Date.now()}`;
    const mobile = (this.inwardForm.customerMobile || '').replace(/\D/g, '').slice(0, 10);
    const inwardIso = `${this.inwardForm.inwardDate}T12:00:00`;

    const serviceLine = {
      id: svc.id,
      name: svc.name,
      price: total,
      originalPrice: Number(svc.price ?? total),
      discountValue: Number(svc.discountValue ?? 0),
      discountType: svc.discountType ?? 'percent',
      qty: 1,
      total
    };

    const jobPayload: Record<string, unknown> = {
      inwardInvoiceNumber: inwardNumber,
      warrantyType: this.inwardForm.warrantyType,
      serviceId: svc.id,
      serviceName: svc.name,
      unitPrice: total,
      total,
      issue: this.inwardForm.issue.trim(),
      purchasedDate: this.inwardForm.purchasedDate || null,
      model: this.inwardForm.model.trim(),
      serial: this.inwardForm.serial.trim(),
      expectedDeliveryDate: this.inwardForm.expectedDeliveryDate,
      inwardDate: inwardIso,
      outwardDate: null,
      status: 'inward' as const,
      customerName: this.inwardForm.customerName?.trim() || '',
      customerMobile: mobile || '',
      paymentMode: this.inwardForm.paymentMode,
      invoiceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saving = true;
    this.loader.show();
    try {
      const jobRef = await this.repairService.addRepairJob(jobPayload);
      const invoiceRef = await this.invoiceService.createInvoice({
        patientCode: mobile ? `REP-${mobile}` : inwardNumber,
        patientId: '',
        name: this.inwardForm.customerName?.trim() || 'Repair Customer',
        mobile: mobile || '—',
        services: [serviceLine],
        products: [],
        total,
        paymentMode: this.inwardForm.paymentMode,
        invoiceNumber: inwardNumber,
        createdAt: new Date().toISOString(),
        date: new Date().toISOString(),
        source: 'repair_inward',
        repairJobId: jobRef.id,
        repairLifecycleStatus: 'inward',
        repairDeliveredAt: null,
        repairMeta: {
          warrantyType: this.inwardForm.warrantyType,
          issue: this.inwardForm.issue.trim(),
          purchasedDate: this.inwardForm.purchasedDate || null,
          model: this.inwardForm.model.trim(),
          serial: this.inwardForm.serial.trim(),
          expectedDeliveryDate: this.inwardForm.expectedDeliveryDate,
          inwardDate: inwardIso
        }
      });
      await this.repairService.updateRepairJob(jobRef.id, {
        invoiceId: invoiceRef.id,
        updatedAt: new Date().toISOString()
      });
      this.toast.show('Inward saved and invoice generated', 'success');
      this.showInwardDialog = false;
      this.resetForm();
    } catch {
      this.toast.show('Failed to save inward entry', 'error');
    } finally {
      this.saving = false;
      this.loader.hide();
    }
  }

  async markOutward(job: any): Promise<void> {
    if (job.status === 'outward') {
      this.toast.show('Already marked outward', 'warning');
      return;
    }
    if (!confirm(`Mark outward for ${job.inwardInvoiceNumber}?`)) return;
    this.loader.show();
    const outwardIso = new Date().toISOString();
    try {
      await this.repairService.updateRepairJob(job.id, {
        status: 'outward',
        outwardDate: outwardIso,
        updatedAt: outwardIso
      });
      const invId = job.invoiceId;
      if (invId) {
        await this.invoiceService.updateInvoice(invId, {
          repairLifecycleStatus: 'outward',
          repairDeliveredAt: outwardIso,
          lastRepairSyncedAt: outwardIso
        });
      }
      this.toast.show('Marked outward. Invoice delivery status updated.', 'success');
    } catch {
      this.toast.show('Could not update job', 'error');
    } finally {
      this.loader.hide();
    }
  }

  openPreview(job: any): void {
    this.previewJob = job;
    this.showInvoicePreview = true;
  }

  closePreview(): void {
    this.showInvoicePreview = false;
    this.previewJob = null;
  }

  async printFormattedInvoice(job: any): Promise<void> {
    this.loader.show();
    try {
      await this.invoicePrint.printRepairInvoice(this.jobForPrint(job));
    } catch {
      this.toast.show('Print failed — allow pop-ups or try Save PDF', 'error');
    } finally {
      this.loader.hide();
    }
  }

  async saveRepairPdf(job: any): Promise<void> {
    this.loader.show();
    try {
      const name = `${job.inwardInvoiceNumber || 'repair'}.pdf`.replace(/\s+/g, '-');
      await this.invoicePrint.downloadRepairInvoicePdf(this.jobForPrint(job), name);
      this.toast.show('PDF saved', 'success');
    } catch {
      this.toast.show('Could not generate PDF', 'error');
    } finally {
      this.loader.hide();
    }
  }

  /** Prefer live job fields; fall back if invoice snapshot is wired later. */
  private jobForPrint(job: any): any {
    return {
      ...job,
      status: job.status,
      repairLifecycleStatus: job.repairLifecycleStatus,
      outwardDate: job.outwardDate,
      repairDeliveredAt: job.repairDeliveredAt
    };
  }

  warrantyLabel(w: string): string {
    return w === 'outside_warranty' ? 'Outside warranty' : 'Under warranty';
  }

  statusLabel(job: any): string {
    return job.status === 'outward' ? 'Outward' : 'Inward';
  }

  formatDate(val: unknown): string {
    if (!val) return '—';
    const d = new Date(val as any);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }

  private jobSortMs(j: any): number {
    const out = j.outwardDate ? new Date(j.outwardDate).getTime() : 0;
    const inn = new Date(j.inwardDate || j.createdAt || 0).getTime();
    return Math.max(out, inn);
  }

  private getSvcTime(s: any): number {
    return new Date(s.createdAt || 0).getTime();
  }
}
