import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CLINIC_CONFIG } from '../../core/config/clinic.config';
import { ToastService } from './toast';

@Injectable({ providedIn: 'root' })
export class InvoicePrintService {

  private logoBase64: string = '';

  constructor(private toast: ToastService) {}

  // ✅ logo fix (CORS safe)
  private async getLogo(): Promise<string> {
    if (this.logoBase64) return this.logoBase64;

    try {
      const res = await fetch(CLINIC_CONFIG.logo);
      const blob = await res.blob();

      this.logoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      return this.logoBase64;
    } catch {
      return CLINIC_CONFIG.logo;
    }
  }

  private normalizeDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    return new Date(value);
  }

  private formatDate(value: any): string {
    const date = this.normalizeDate(value);
    if (!date || Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private formatCurrency(value: any): string {
    const amount = Number(value ?? 0);
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  private normalizeWhatsappNumber(raw: any): string | null {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (!digits) return null;
    // India default: if 10 digits, assume +91
    if (digits.length === 10) return `91${digits}`;
    // If already has country code (>=11), use as-is
    if (digits.length >= 11 && digits.length <= 15) return digits;
    return null;
  }

  private renderServices(services: any[]): string {
    if (!services?.length) {
      return `<tr><td colspan="5" class="empty">No services</td></tr>`;
    }

    return services.map((s, i) => `
      <tr>
        <td>${i + 1}. ${s.name || '-'}</td>
        <td>1</td>
        <td>${this.formatCurrency(s.price)}</td>
        <td>-</td>
        <td>${this.formatCurrency(s.total ?? s.price)}</td>
      </tr>
    `).join('');
  }

  private renderProducts(products: any[]): string {
    if (!products?.length) {
      return `<tr><td colspan="4" class="empty">No products</td></tr>`;
    }

    return products.map((p, i) => `
      <tr>
        <td>${i + 1}. ${p.name || '-'}</td>
        <td>${p.qty ?? 1}</td>
        <td>${this.formatCurrency(p.price)}</td>
        <td>${this.formatCurrency(p.total ?? p.price)}</td>
      </tr>
    `).join('');
  }

  private getInvoiceHtml(invoice: any, logo: string): string {

    const total =
      (invoice.services || []).reduce((s: number, i: any) => s + (i.total ?? i.price ?? 0), 0) +
      (invoice.products || []).reduce((s: number, i: any) => s + (i.total ?? i.price ?? 0), 0);

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root{
    --slate-50:#f8fafc; --slate-100:#f1f5f9; --slate-200:#e2e8f0; --slate-600:#475569; --slate-900:#0f172a;
    --brand-600:#2563eb;
  }
  *{ box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 22px; color: var(--slate-900); background: #fff; }
  .container { max-width: 900px; margin: auto; }
  .header { display: flex; justify-content: space-between; gap: 18px; border-bottom: 1px solid var(--slate-200); padding-bottom: 14px; }
  .logo { height: 56px; }
  .title { text-align: right; }
  .title h2{ margin:0; letter-spacing:-0.02em; }
  .muted{ color: var(--slate-600); }
  .section { margin-top: 16px; }
  .card { border: 1px solid var(--slate-200); border-radius: 14px; padding: 12px 14px; background: linear-gradient(180deg, var(--slate-50) 0%, #fff 80%); }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid var(--slate-200); padding: 10px 10px; vertical-align: top; }
  th { background: var(--slate-50); font-weight: 700; text-align: left; }
  tr:last-child td { border-bottom: none; }
  .totals { display:flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(37, 99, 235, 0.25); background: linear-gradient(180deg, #eff6ff 0%, #fff 85%); }
  .totals strong{ font-size: 20px; }
  .footer { margin-top: 18px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
  .sign { text-align: right; padding-top: 16px; }
  .small { font-size: 12px; }
  .disclaimer { margin-top: 14px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--slate-200); background: #fff; }
  .disclaimer h4{ margin:0 0 6px; font-size: 13px; }
  .disclaimer ul{ margin:0; padding-left: 18px; color: var(--slate-600); font-size: 12px; line-height: 1.45; }
  .disclaimer li{ margin: 4px 0; }
</style>
</head>

<body>
<div class="container">

  <div class="header">
    <div>
      <img src="${logo}" class="logo"/>
      <h2>${CLINIC_CONFIG.name}</h2>
      <div class="small">${CLINIC_CONFIG.address}</div>
      <div class="small">${CLINIC_CONFIG.phone}</div>

      <!-- ✅ Specialists FIX -->
      <div class="small">
        <strong>Specialists:</strong><br/>
        ${CLINIC_CONFIG.specialist1 || ''} ${CLINIC_CONFIG.specialist1Desg || ''}<br/>
        ${CLINIC_CONFIG.specialist2 || ''} ${CLINIC_CONFIG.specialist2Desg || ''}
      </div>
    </div>

    <div class="title">
      <h2>INVOICE</h2>
      <div>No: ${invoice.invoiceNumber || '-'}</div>
      <div>Date: ${this.formatDate(invoice.createdAt)}</div>
    </div>
  </div>

<div class="section">
  <div class="card">
  <table style="border: none; width: 100%;">
    <tr>
      <td style="border: none; width: 50%;">
        <strong>Patient:</strong> ${invoice.name || '-'}
      </td>
      <td style="border: none;">
        <strong>Mobile:</strong> ${invoice.mobile || '-'}
      </td>
    </tr>

    <tr>
      <td style="border: none;">
        <strong>Age:</strong> ${invoice.age ?? '-'}
      </td>
      <td style="border: none;">
        <strong>Gender:</strong> ${invoice.gender || '-'}
      </td>
    </tr>
  </table>
  </div>
</div>
  <div class="section">
    <h3>Services</h3>
    <table>
      <tr>
        <th>Name</th><th>Qty</th><th>Price</th><th>Disc</th><th>Total</th>
      </tr>
      ${this.renderServices(invoice.services)}
    </table>
  </div>

  <div class="section">
    <h3>Products</h3>
    <table>
      <tr>
        <th>Name</th><th>Qty</th><th>Price</th><th>Total</th>
      </tr>
      ${this.renderProducts(invoice.products)}
    </table>
  </div>

  <div class="section">
    <div class="totals">
      <span class="muted"><strong>Total</strong> (incl. services & products)</span>
      <strong>${this.formatCurrency(total)}</strong>
    </div>
  </div>

  <div class="disclaimer">
    <h4>Disclaimers</h4>
    <ul>
      <li>Services once rendered and products once supplied are non-refundable.</li>
      <li>Warranty/guarantee (if any) is provided by the manufacturer/service provider as applicable.</li>
      <li>Please retain this invoice for warranty, exchange, or support queries.</li>
      <li>All disputes are subject to the local jurisdiction of the clinic location.</li>
    </ul>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="small muted">
      Thank you for visiting <strong>${CLINIC_CONFIG.name}</strong>.
    </div>
    <div class="sign small">
      <strong>${CLINIC_CONFIG.name}</strong><br/>
      Authorized Signatory
    </div>
  </div>

</div>
</body>
</html>
`;
  }

  private async createPrintFrame(html: string): Promise<HTMLIFrameElement> {
    const iframe = document.createElement('iframe');
    // Must have a real renderable size for html2canvas.
    // Keep it offscreen so it can't affect the app UI.
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '960px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return iframe;

    doc.open();
    doc.write(html);
    doc.close();

    // Give the browser a moment to layout.
    await new Promise(r => setTimeout(r, 50));

    return iframe;
  }

  private async waitImages(root: HTMLElement) {
    const imgs = root.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(img =>
      img.complete ? Promise.resolve() :
        new Promise(res => {
          img.onload = res;
          img.onerror = res;
        })
    ));
  }

  private async printHtmlInSameTab(html: string): Promise<void> {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for images/fonts to settle before printing.
    await new Promise<void>((resolve) => {
      const win = iframe.contentWindow;
      if (!win) return resolve();
      const done = () => resolve();
      win.addEventListener('load', done, { once: true });
      // Fallback in case load doesn't fire (about:blank timing).
      setTimeout(done, 500);
    });

    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // Clean up after a short delay (allows print dialog to open first).
      setTimeout(() => iframe.remove(), 1000);
    }
  }

  // ✅ FIXED (supports 2 params)
  async previewInvoice(invoice: any, title = 'Invoice') {
    const logo = await this.getLogo();
    const html = this.getInvoiceHtml(invoice, logo);

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(html);
    win.document.close();
  }

  // ✅ FIXED (supports 2 params)
  async printInvoice(invoice: any, title = 'Invoice') {
    const logo = await this.getLogo();
    const html = this.getInvoiceHtml(invoice, logo);
    await this.printHtmlInSameTab(html);
  }

  // ✅ FIXED (supports filename)
  async downloadInvoice(invoice: any, fileName = 'Invoice.pdf') {
    this.toast.show('Downloading started…', 'warning');
    const logo = await this.getLogo();
    const html = this.getInvoiceHtml(invoice, logo);
    const iframe = await this.createPrintFrame(html);
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const root = (doc?.querySelector('.container') as HTMLElement) || (doc?.body as HTMLElement);

      await this.waitImages(root);
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(root, { scale: 2, useCORS: true });
      const img = canvas.toDataURL('image/png');

      const pdf = new jsPDF();
      pdf.addImage(img, 'PNG', 10, 10, 190, 0);
      pdf.save(fileName);
    } catch (e) {
      console.error(e);
      this.toast.show('Download failed. Please try again.', 'error');
    } finally {
      iframe.remove();
    }
  }

  shareWhatsApp(invoice: any) {
    const invNo = invoice?.invoiceNumber || '-';
    const date = this.formatDate(invoice?.createdAt || invoice?.date);
    const name = invoice?.name || '-';
    const mobile = invoice?.mobile || '-';
    const payment = invoice?.paymentMode || '-';

    const services: any[] = Array.isArray(invoice?.services) ? invoice.services : [];
    const products: any[] = Array.isArray(invoice?.products) ? invoice.products : [];

    const serviceLines = services.map((s, idx) => {
      const lineTotal = Number(s?.total ?? s?.price ?? 0);
      return `- ${s?.name || '-'}: ${this.formatCurrency(lineTotal)}`;
    });

    const productLines = products.map((p, idx) => {
      const qty = Number(p?.qty ?? 1);
      const lineTotal = Number(p?.total ?? (Number(p?.price ?? 0) * qty));
      return `- ${p?.name || '-'} x${qty}: ${this.formatCurrency(lineTotal)}`;
    });

    const total =
      (services || []).reduce((s: number, i: any) => s + Number(i?.total ?? i?.price ?? 0), 0) +
      (products || []).reduce((s: number, i: any) => s + Number(i?.total ?? i?.price ?? 0), 0);

    const message = [
      `*${CLINIC_CONFIG.name}*`,
      `INVOICE`,
      `------------------------------`,
      `Invoice No: *${invNo}*`,
      `Date: ${date}`,
      ` `,
      `Patient: *${name}*`,
      `Mobile: ${mobile}`,
      invoice?.age != null ? `Age: ${invoice.age}` : null,
      invoice?.gender ? `Gender: ${invoice.gender}` : null,
      ` `,
      services.length ? `*Services*` : null,
      ...(services.length ? serviceLines : ['- None']),
      ` `,
      products.length ? `*Products*` : null,
      ...(products.length ? productLines : ['- None']),
      ` `,
      `Payment Mode: *${payment}*`,
      ` `,
      `TOTAL: *${this.formatCurrency(total)}*`,
      ` `,
      `_Note: Services/products once provided are non-refundable._`,
      ` `,
      `Thank you.`
    ]
      .filter(Boolean)
      .join('\n');

    const to = this.normalizeWhatsappNumber(invoice?.mobile);
    const url = to
      ? `https://wa.me/${to}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url);
  }

  /** Repair inward job (from repairing module): matches clinic invoice layout + repair fields + delivery status. */
  private getRepairInvoiceHtml(job: any, logo: string): string {
    const isDelivered =
      job.status === 'outward' || String(job.repairLifecycleStatus || '').toLowerCase() === 'outward';
    const deliveredAt = job.outwardDate || job.repairDeliveredAt;
    const deliveryLine = isDelivered
      ? `<strong>Delivered:</strong> Yes &nbsp;|&nbsp; <strong>Delivery date:</strong> ${this.formatDate(deliveredAt)}`
      : `<strong>Delivered:</strong> Pending &nbsp;|&nbsp; <strong>Expected delivery:</strong> ${this.formatDate(job.expectedDeliveryDate)}`;

    const svcEsc = String(job.serviceName || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const total = Number(job.total ?? 0);

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
.container { max-width: 900px; margin: auto; }
.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
.logo { height: 60px; object-fit: contain; }
.title { text-align: right; }
.small { font-size: 11px; line-height: 1.35; }
.section { margin-top: 16px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #000; padding: 8px; font-size: 13px; }
th { background: #f0f0f0; }
.meta-grid { width: 100%; border: none !important; }
.meta-grid td { border: none !important; vertical-align: top; padding: 4px 8px 4px 0; font-size: 13px; }
.delivery-box { margin-top: 14px; padding: 10px 12px; border: 1px solid #000; background: #fafafa; font-size: 13px; }
.sign { margin-top: 48px; text-align: center; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <img src="${logo}" class="logo" alt="Logo"/>
      <h2 style="margin:8px 0 4px">${CLINIC_CONFIG.name}</h2>
      <div class="small">${CLINIC_CONFIG.subjectLine || ''}</div>
      <div class="small" style="margin-top:6px">${CLINIC_CONFIG.address}</div>
      <div class="small">${CLINIC_CONFIG.phone}</div>
      <div class="small" style="margin-top:8px">
        <strong>Specialists:</strong><br/>
        ${CLINIC_CONFIG.specialist1 || ''} ${CLINIC_CONFIG.specialist1Desg || ''}<br/>
        ${CLINIC_CONFIG.specialist2 || ''} ${CLINIC_CONFIG.specialist2Desg || ''}
      </div>
    </div>
    <div class="title">
      <h2>REPAIR INWARD INVOICE</h2>
      <div>No: ${job.inwardInvoiceNumber || '-'}</div>
      <div>Inward date: ${this.formatDate(job.inwardDate || job.createdAt)}</div>
      <div>Payment: ${String(job.paymentMode || '-').toUpperCase()}</div>
      <div>Total: ${this.formatCurrency(total)}</div>
    </div>
  </div>

  <div class="section delivery-box">
    ${deliveryLine}
  </div>

  <div class="section">
    <table class="meta-grid">
      <tr>
        <td><strong>Customer:</strong> ${job.customerName || '-'}</td>
        <td><strong>Mobile:</strong> ${job.customerMobile || '-'}</td>
      </tr>
      <tr>
        <td><strong>Warranty:</strong> ${String(job.warrantyType || '').includes('outside') ? 'Outside warranty' : 'Under warranty'}</td>
        <td><strong>Purchased on:</strong> ${this.formatDate(job.purchasedDate)}</td>
      </tr>
      <tr>
        <td><strong>Model:</strong> ${job.model || '-'}</td>
        <td><strong>Serial:</strong> ${job.serial || '-'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <strong>Issue reported</strong>
    <p style="margin:6px 0 0;font-size:13px;white-space:pre-wrap">${(job.issue || '-').replace(/</g, '&lt;')}</p>
  </div>

  <div class="section">
    <h3 style="margin:0 0 8px;font-size:15px;">Particulars</h3>
    <table>
      <tr>
        <th>Description</th><th>Qty</th><th>Rate</th><th>Total</th>
      </tr>
      <tr>
        <td>${svcEsc}</td>
        <td>1</td>
        <td>${this.formatCurrency(total)}</td>
        <td>${this.formatCurrency(total)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2 style="margin:0;font-size:18px;">Amount payable: ${this.formatCurrency(total)}</h2>
  </div>

  <div style="margin-top:32px;display:flex;justify-content:space-between;font-size:12px;">
    <div class="sign">
      ________________________<br/>Customer signature
    </div>
    <div class="sign">
      ________________________<br/>${CLINIC_CONFIG.name} (Authorised signatory)
    </div>
  </div>
</div>
</body>
</html>
`;
  }

  async printRepairInvoice(job: any) {
    const logo = await this.getLogo();
    const html = this.getRepairInvoiceHtml(job, logo);
    await this.printHtmlInSameTab(html);
  }

  async downloadRepairInvoicePdf(job: any, fileName?: string) {
    this.toast.show('Downloading started…', 'warning');
    const logo = await this.getLogo();
    const html = this.getRepairInvoiceHtml(job, logo);
    const iframe = await this.createPrintFrame(html);
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const root = (doc?.querySelector('.container') as HTMLElement) || (doc?.body as HTMLElement);

      await this.waitImages(root);
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(root, { scale: 2, useCORS: true });

      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(img, 'PNG', 10, 10, 190, 0);
      pdf.save(fileName || `Repair-${job.inwardInvoiceNumber || 'invoice'}.pdf`);
    } catch (e) {
      console.error(e);
      this.toast.show('Download failed. Please try again.', 'error');
    } finally {
      iframe.remove();
    }
  }
}