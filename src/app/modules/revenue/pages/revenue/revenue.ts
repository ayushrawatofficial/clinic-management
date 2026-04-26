import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../../core/services/invoice';
import { ToastService } from '../../../../shared/services/toast';
import { LoaderService } from '../../../../shared/services/loader';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenue.html',
  styleUrls: ['./revenue.scss']
})
export class RevenueComponent implements OnInit {
  invoices: any[] = [];
  today = new Date();
  fromDate = '';
  toDate = '';
  rangeTotal = 0;
  rangeCount = 0;

  constructor(
    private invoiceService: InvoiceService,
    private toast: ToastService,
    private loader: LoaderService
  ) {}

  ngOnInit(): void {
    this.loadRevenue();
  }

  loadRevenue() {
    this.loader.show();
    this.invoiceService.getAllInvoices().subscribe({
      next: (data: any[]) => {
        this.invoices = (data || []).sort((a, b) => this.getInvoiceDateMs(b) - this.getInvoiceDateMs(a));
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.toast.show('Failed to load revenue data', 'error');
      }
    });
  }

  get todayRevenue(): number {
    const now = new Date();
    return this.sumInvoices(this.invoices.filter(inv => {
      const d = this.getInvoiceDate(inv);
      return d.toDateString() === now.toDateString();
    }));
  }

  get thisMonthRevenue(): number {
    const now = new Date();
    return this.sumInvoices(this.invoices.filter(inv => {
      const d = this.getInvoiceDate(inv);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }));
  }

  get currentFinancialYearRange() {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const start = new Date(year, 3, 1, 0, 0, 0, 0);
    const end = new Date(year + 1, 2, 31, 23, 59, 59, 999);
    return { start, end };
  }

  get currentFinancialYearRevenue(): number {
    const range = this.currentFinancialYearRange;
    return this.sumInvoices(this.invoices.filter(inv => {
      const d = this.getInvoiceDate(inv);
      return d >= range.start && d <= range.end;
    }));
  }

  get currentFinancialYearLabel(): string {
    const range = this.currentFinancialYearRange;
    const startYear = range.start.getFullYear();
    const endYear = range.end.getFullYear();
    return `01 Apr ${startYear} - 31 Mar ${endYear}`;
  }

  applyDateRange() {
    if (!this.fromDate || !this.toDate) {
      this.rangeTotal = 0;
      this.rangeCount = 0;
      return;
    }

    const from = new Date(this.fromDate + 'T00:00:00');
    const to = new Date(this.toDate + 'T23:59:59');

    if (from > to) {
      this.toast.show('From date must be before To date', 'error');
      return;
    }

    const inRange = this.getInvoicesByDateRange(from, to);

    this.rangeTotal = this.sumInvoices(inRange);
    this.rangeCount = inRange.length;
  }

  downloadMonthlyReport() {
    const source = this.filteredInvoices;
    const grouped = new Map<string, { count: number; total: number }>();
    source.forEach(inv => {
      const date = this.getInvoiceDate(inv);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = grouped.get(monthKey) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(inv.total || 0);
      grouped.set(monthKey, current);
    });

    const monthRows = Array.from(grouped.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([month, value]) => [month, value.count, value.total]);

    const data: any[][] = [
      ['Detailed Revenue Report'],
      ['Generated At', new Date().toLocaleString()],
      ['Date Filter', this.fromDate && this.toDate ? `${this.fromDate} to ${this.toDate}` : 'All Dates'],
      [],
      ['Month-wise Revenue'],
      ['Month', 'Invoices', 'Total Revenue'],
      ...monthRows,
      [],
      ['Date-wise Revenue'],
      ['Date', 'Invoices', 'Total Revenue'],
      ...this.dateWiseSummary.map(item => [item.date, item.count, item.total]),
      [],
      ['Service-wise Revenue'],
      ['Service', 'Qty', 'Total Revenue'],
      ...this.serviceWiseSummary.map(item => [item.name, item.qty, item.total]),
      [],
      ['Product-wise Revenue'],
      ['Product', 'Qty', 'Total Revenue'],
      ...this.productWiseSummary.map(item => [item.name, item.qty, item.total]),
      [],
      ['Payment Mode-wise Revenue'],
      ['Payment Mode', 'Invoices', 'Total Revenue'],
      ...this.paymentModeSummary.map(item => [item.mode, item.count, item.total]),
      [],
      ['Top 10 Services'],
      ['Service', 'Qty', 'Total Revenue'],
      ...this.topServices.map(item => [item.name, item.qty, item.total]),
      [],
      ['Top 10 Products'],
      ['Product', 'Qty', 'Total Revenue'],
      ...this.topProducts.map(item => [item.name, item.qty, item.total]),
      [],
      ['Grand Total Revenue', '', this.grandTotalRevenue]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 36 }, { wch: 18 }, { wch: 22 }];
    (ws as any)['!pageSetup'] = {
      paperSize: 9,
      orientation: 'landscape',
      fitToWidth: 1,
      fitToHeight: 0
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Revenue Report');
    XLSX.writeFile(wb, `detailed-revenue-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    this.toast.show('Detailed Excel report downloaded', 'success');
  }

  get grandTotalRevenue(): number {
    return this.sumInvoices(this.filteredInvoices);
  }

  get filteredInvoices(): any[] {
    if (!this.fromDate || !this.toDate) return this.invoices;

    const from = new Date(this.fromDate + 'T00:00:00');
    const to = new Date(this.toDate + 'T23:59:59');
    if (from > to) return this.invoices;

    return this.getInvoicesByDateRange(from, to);
  }

  get dateWiseSummary(): Array<{ date: string; count: number; total: number }> {
    const grouped = new Map<string, { count: number; total: number }>();
    this.filteredInvoices.forEach(inv => {
      const dateKey = this.getInvoiceDate(inv).toISOString().slice(0, 10);
      const current = grouped.get(dateKey) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(inv.total || 0);
      grouped.set(dateKey, current);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, value]) => ({
        date,
        count: value.count,
        total: value.total
      }));
  }

  get serviceWiseSummary(): Array<{ name: string; qty: number; total: number }> {
    const grouped = new Map<string, { qty: number; total: number }>();
    this.filteredInvoices.forEach(inv => {
      (inv.services || []).forEach((service: any) => {
        const name = service?.name || 'Unknown Service';
        const qty = Number(service?.qty || 1);
        const lineTotal = Number(service?.total || service?.price || 0);
        const current = grouped.get(name) || { qty: 0, total: 0 };
        current.qty += qty;
        current.total += lineTotal;
        grouped.set(name, current);
      });
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, qty: value.qty, total: value.total }))
      .sort((a, b) => b.total - a.total);
  }

  get productWiseSummary(): Array<{ name: string; qty: number; total: number }> {
    const grouped = new Map<string, { qty: number; total: number }>();
    this.filteredInvoices.forEach(inv => {
      (inv.products || []).forEach((product: any) => {
        const name = product?.name || 'Unknown Product';
        const qty = Number(product?.qty || 1);
        const lineTotal = Number(product?.total || (Number(product?.price || 0) * qty));
        const current = grouped.get(name) || { qty: 0, total: 0 };
        current.qty += qty;
        current.total += lineTotal;
        grouped.set(name, current);
      });
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, qty: value.qty, total: value.total }))
      .sort((a, b) => b.total - a.total);
  }

  get paymentModeSummary(): Array<{ mode: string; count: number; total: number }> {
    const grouped = new Map<string, { count: number; total: number }>();
    this.filteredInvoices.forEach(inv => {
      const mode = String(inv?.paymentMode || 'Not Specified').trim();
      const key = mode || 'Not Specified';
      const current = grouped.get(key) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(inv?.total || 0);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .map(([mode, value]) => ({ mode, count: value.count, total: value.total }))
      .sort((a, b) => b.total - a.total);
  }

  get topServices(): Array<{ name: string; qty: number; total: number }> {
    return this.serviceWiseSummary.slice(0, 10);
  }

  get topProducts(): Array<{ name: string; qty: number; total: number }> {
    return this.productWiseSummary.slice(0, 10);
  }

  private sumInvoices(records: any[]): number {
    return records.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  }

  private getInvoiceDate(inv: any): Date {
    return new Date(inv?.createdAt || inv?.date || Date.now());
  }

  private getInvoiceDateMs(inv: any): number {
    return this.getInvoiceDate(inv).getTime();
  }

  private getInvoicesByDateRange(from: Date, to: Date): any[] {
    return this.invoices.filter(inv => {
      const d = this.getInvoiceDate(inv);
      return d >= from && d <= to;
    });
  }

}
