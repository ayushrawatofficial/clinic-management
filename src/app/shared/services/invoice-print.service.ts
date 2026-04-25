import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CLINIC_CONFIG } from '../../core/config/clinic.config';

@Injectable({ providedIn: 'root' })
export class InvoicePrintService {

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
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  private renderServices(services: any[]): string {
    if (!services || services.length === 0) {
      return '<tr><td colspan="5" class="empty">No services</td></tr>';
    }

    return services.map((service: any, index: number) => {
      const unitPrice = this.formatCurrency(service.originalPrice ?? service.price ?? 0);
      const discountValue = service.discountValue ?? 0;
      const discountText = discountValue
        ? service.discountType === 'percent'
          ? `${discountValue}%`
          : this.formatCurrency(discountValue)
        : '-';
      const total = this.formatCurrency(service.total ?? service.price ?? 0);

      return `<tr>\n        <td>${index + 1}. ${service.name || '-'}</td>\n        <td>1</td>\n        <td>${unitPrice}</td>\n        <td>${discountText}</td>\n        <td>${total}</td>\n      </tr>`;
    }).join('');
  }

  private renderProducts(products: any[]): string {
    if (!products || products.length === 0) {
      return '<tr><td colspan="4" class="empty">No products</td></tr>';
    }

    return products.map((product: any, index: number) => {
      const qty = product.qty ?? 1;
      const price = this.formatCurrency(product.price ?? 0);
      const total = this.formatCurrency(product.total ?? (product.price ?? 0) * qty);
      return `<tr>\n        <td>${index + 1}. ${product.name || '-'}</td>\n        <td>${qty}</td>\n        <td>${price}</td>\n        <td>${total}</td>\n      </tr>`;
    }).join('');
  }

  private getInvoiceHtml(invoice: any, title = 'Invoice'): string {
    const invoiceDate = this.formatDate(invoice.date || invoice.createdAt);
    const serviceCount = (invoice.services || []).length;
    const productCount = (invoice.products || []).length;
    const totalItems = serviceCount + productCount;
    const totalQuantity = (invoice.products || []).reduce((sum: number, item: any) => sum + (item.qty ?? 1), 0) + serviceCount;

    const subTotalAmount = (invoice.services || []).reduce((sum: number, item: any) => sum + Number(item.price ?? 0), 0)
      + (invoice.products || []).reduce((sum: number, item: any) => sum + Number(item.total ?? (item.price ?? 0) * (item.qty ?? 1)), 0);
    const subTotal = this.formatCurrency(subTotalAmount);
    const total = this.formatCurrency(invoice.total ?? subTotalAmount);

    return `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8" />\n  <title>${title}</title>\n  <style>\n    body { margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #1a1a1a; }\n    .invoice-container { max-width: 900px; margin: 0 auto; }\n    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }\n    .brand { display: flex; align-items: center; gap: 16px; }\n    .brand img { height: 60px; width: auto; object-fit: contain; }\n    .brand-info h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }\n    .brand-info p { margin: 4px 0 0; font-size: 12px; line-height: 1.4; color: #4d4d4d; }\n    .meta { text-align: right; }\n    .meta h2 { margin: 0; font-size: 18px; }\n    .meta p { margin: 4px 0 0; font-size: 12px; color: #4d4d4d; }\n    .section { margin-bottom: 20px; }\n    .section-title { margin: 0 0 8px; font-size: 14px; text-transform: uppercase; color: #3b3b3b; letter-spacing: 0.05em; }\n    .box { border: 1px solid #ddd; border-radius: 10px; background: #fafafa; padding: 16px; }\n    table { width: 100%; border-collapse: collapse; margin-top: 12px; }\n    th, td { border: 1px solid #ddd; padding: 10px 12px; }\n    th { background: #f5f5f5; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }\n    td { font-size: 12px; }\n    .empty { text-align: center; color: #777; }\n    .totals { width: 100%; max-width: 400px; margin-left: auto; margin-top: 16px; }\n    .totals tr td { border: none; padding: 8px 12px; }\n    .totals tr td:first-child { color: #4d4d4d; }\n    .totals tr.total td { font-weight: 700; border-top: 1px solid #ddd; }\n    footer { margin-top: 36px; font-size: 11px; color: #6b6b6b; line-height: 1.5; }\n  </style>\n</head>\n<body>\n  <div class="invoice-container">\n    <div class="header">\n      <div class="brand">\n        <img src="${CLINIC_CONFIG.logo}" alt="${CLINIC_CONFIG.name}" />\n        <div class="brand-info">\n          <h1>${CLINIC_CONFIG.name}</h1>\n          <p>${CLINIC_CONFIG.subjectLine}</p>\n          <p>${CLINIC_CONFIG.address}</p>\n          <p>${CLINIC_CONFIG.phone}</p>\n        </div>\n      </div>\n      <div class="meta">\n        <h2>Invoice</h2>\n        <p><strong>Number:</strong> ${invoice.invoiceNumber || '-'}</p>\n        <p><strong>Date:</strong> ${invoiceDate}</p>\n        <p><strong>Patient:</strong> ${invoice.name || '-'}</p>\n        <p><strong>Mobile:</strong> ${invoice.mobile || '-'}</p>\n      </div>\n    </div>\n\n    <div class="section">\n      <div class="section-title">Services</div>\n      <div class="box">\n        <table>\n          <thead>\n            <tr>\n              <th>Description</th>\n              <th>Price</th>\n            </tr>\n          </thead>\n          <tbody>\n            ${this.renderServices(invoice.services || [])}\n          </tbody>\n        </table>\n      </div>\n    </div>\n\n    <div class="section">\n      <div class="section-title">Products</div>\n      <div class="box">\n        <table>\n          <thead>\n            <tr>\n              <th>Description</th>\n              <th>Qty</th>\n              <th>Unit</th>\n              <th>Total</th>\n            </tr>\n          </thead>\n          <tbody>\n            ${this.renderProducts(invoice.products || [])}\n          </tbody>\n        </table>\n      </div>\n    </div>\n\n    <table class="totals">\n      <tr>\n        <td>Subtotal</td>\n        <td>${subTotal}</td>\n      </tr>\n      <tr class="total">\n        <td>Total</td>\n        <td>${total}</td>\n      </tr>\n    </table>\n\n    <footer>\n      ${CLINIC_CONFIG.name} • ${CLINIC_CONFIG.phone} • ${CLINIC_CONFIG.email}\n    </footer>\n  </div>\n</body>\n</html>`;
  }

  private createHiddenContainer(html: string): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '1200px';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    container.style.zIndex = '-1000';
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
  }

  private async loadImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(images.map(image => new Promise<void>(resolve => {
      if (image.complete) {
        resolve();
        return;
      }
      image.onload = () => resolve();
      image.onerror = () => resolve();
    })));
  }

  previewInvoice(invoice: any, title = 'Invoice') {
    const html = this.getInvoiceHtml(invoice, title);
    const win = window.open('', '_blank', 'width=900,height=800');
    if (!win) return;

    win.document.write(html);
    win.document.close();
    win.focus();
  }

  printInvoice(invoice: any, title = 'Invoice') {
    const html = this.getInvoiceHtml(invoice, title);
    const win = window.open('', '', 'width=900,height=800');
    if (!win) return;

    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  async downloadInvoice(invoice: any, fileName = 'Invoice.pdf') {
    const html = this.getInvoiceHtml(invoice, fileName.replace(/\.pdf$/i, ''));
    const container = this.createHiddenContainer(html);

    try {
      await this.loadImages(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = 190;
      const ratio = canvas.width / canvas.height;
      const height = width / ratio;
      pdf.addImage(imgData, 'PNG', 10, 10, width, height);
      pdf.save(fileName);
    } finally {
      container.remove();
    }
  }

  shareWhatsApp(invoice: any) {
    if (!invoice) return;

    let msg = `🧾 *Clinic Invoice*\n\n`;
    msg += `👤 ${invoice.name || ''}\n📱 ${invoice.mobile || ''}\n\n`;

    (invoice.services || []).forEach((s: any, i: number) => {
      msg += `${i + 1}. ${s.name || '-'} - ${this.formatCurrency(s.price)}\n`;
    });

    (invoice.products || []).forEach((p: any, i: number) => {
      const index = (invoice.services || []).length + i + 1;
      const qty = p.qty ?? 1;
      const total = this.formatCurrency(p.total ?? (p.price ?? 0) * qty);
      msg += `${index}. ${p.name || '-'} x${qty} - ${total}\n`;
    });

    msg += `\n💰 Total: ${this.formatCurrency(invoice.total)}`;
    msg += `\n\n📎 Please attach PDF from download`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }
}
