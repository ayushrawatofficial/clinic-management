import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CLINIC_CONFIG } from '../../core/config/clinic.config';

@Injectable({ providedIn: 'root' })
export class InvoicePrintService {

  private logoBase64: string = '';

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
body { font-family: Arial; padding: 20px; color: #000; }
.container { max-width: 900px; margin: auto; }
.header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; }
.logo { height: 60px; }
.title { text-align: right; }
.section { margin-top: 20px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #000; padding: 8px; }
th { background: #f0f0f0; }
.footer { margin-top: 40px; display: flex; justify-content: space-between; }
.sign { text-align: center; }
.small { font-size: 12px; }
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

    <tr>
      <td style="border: none;">
        <strong>Referred By:</strong> ${invoice.referredBy || '-'}
      </td>
      <td style="border: none;">
        <strong>Problem:</strong> ${invoice.problem || '-'}
      </td>
    </tr>
  </table>
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
    <h2>Total: ${this.formatCurrency(total)}</h2>
  </div>

  <!-- ✅ Footer -->
  <div class="footer">
    <div class="sign">
      ___________________<br/>
      Patient Signature
    </div>

    <div class="sign">
      <strong>${CLINIC_CONFIG.name}</strong><br/>
      (Seal & Signature)
    </div>
  </div>

</div>
</body>
</html>
`;
  }

  private createContainer(html: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.style.position = 'fixed';
    div.style.left = '-9999px';
    document.body.appendChild(div);
    return div;
  }

  private async waitImages(container: HTMLElement) {
    const imgs = container.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(img =>
      img.complete ? Promise.resolve() :
        new Promise(res => {
          img.onload = res;
          img.onerror = res;
        })
    ));
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

    const win = window.open('');
    if (!win) return;

    win.document.write(html);
    win.document.close();

    setTimeout(() => win.print(), 500);
  }

  // ✅ FIXED (supports filename)
  async downloadInvoice(invoice: any, fileName = 'Invoice.pdf') {
    const logo = await this.getLogo();
    const html = this.getInvoiceHtml(invoice, logo);

    const container = this.createContainer(html);

    await this.waitImages(container);
    await new Promise(r => setTimeout(r, 300));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true
    });

    const img = canvas.toDataURL('image/png');

    const pdf = new jsPDF();
    pdf.addImage(img, 'PNG', 10, 10, 190, 0);

    pdf.save(fileName);

    container.remove();
  }

  shareWhatsApp(invoice: any) {
    let msg = `🧾 Invoice\n${invoice.name}\n₹${invoice.total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  }
}