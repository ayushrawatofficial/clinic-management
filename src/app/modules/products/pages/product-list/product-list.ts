import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../../core/services/product';
import { AddProductComponent } from '../add-product/add-product';
import { ToastService } from '../../../../shared/services/toast';
import { LoaderService } from '../../../../shared/services/loader';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddProductComponent],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss']
})
export class ProductListComponent implements OnInit {

  products: any[] = [];
  filtered: any[] = [];
  visibleFiltered: any[] = [];

  showDialog = false;
  selectedProduct: any = null;

  search = '';
  readonly pageSize = 100;
  displayedCount = 100;

  filters = {
  name: '',
  desc: '',
  price: '',
  stock: '',
  status: ''
};

  sub!: Subscription;

  constructor(private productService: ProductService,
    private toast: ToastService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loader.show();
    this.sub = this.productService.getProducts().subscribe(data => {
      this.products = (data || []).sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));
      this.applyFilter();

      this.loader.hide();
      this.cdr.detectChanges();
    }, error => {
      console.error('Error loading products:', error);
      this.loader.hide();
      this.toast.show('Failed to load products', 'error');
    });
  }

  // 🔥 STATUS
  getStatus(p: any) {
    if (p.stock === 0) return 'out';
    if (p.stock <= p.lowStock) return 'low';
    return 'ok';
  }

  // 🔥 FILTER LOGIC
  applyFilter() {

    const term = this.search.toLowerCase();

    this.filtered = this.products.filter(p => {

      const status = this.getStatus(p);

      return (
        (!this.filters.name || p.name?.toLowerCase().includes(this.filters.name.toLowerCase())) &&
        (!this.filters.desc || p.description?.toLowerCase().includes(this.filters.desc.toLowerCase())) &&
        (!this.filters.price || p.price?.toString().includes(this.filters.price)) &&
        (!this.filters.stock || p.stock?.toString().includes(this.filters.stock)) &&
        (!this.filters.status || status === this.filters.status) &&

        (
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
        )
      );

    });
    this.filtered.sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));
    this.resetVisibleData();
  }

  onTableScroll(event: Event) {
    const element = event.target as HTMLElement;
    const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 100;
    if (nearBottom) {
      this.loadMore();
    }
  }

  loadMore() {
    if (this.displayedCount >= this.filtered.length) return;
    this.displayedCount = Math.min(this.displayedCount + this.pageSize, this.filtered.length);
    this.visibleFiltered = this.filtered.slice(0, this.displayedCount);
  }

  resetVisibleData() {
    this.displayedCount = Math.min(this.pageSize, this.filtered.length);
    this.visibleFiltered = this.filtered.slice(0, this.displayedCount);
  }

  private getLatestDateMs(product: any): number {
    return product?.createdAt ? new Date(product.createdAt).getTime() : 0;
  }
 ngOnDestroy() {
    this.sub?.unsubscribe();
  }
  openDialog(data: any = null) {
    this.selectedProduct = data;
    this.showDialog = true;
  }

  async delete(p: any) {
    this.loader.show();
    await this.productService.deleteProduct(p.id);
    this.toast.show('Product deleted successfully', 'error');

    this.loader.hide();
     this.cdr.detectChanges();
  }

  closeDialog() {
    this.showDialog = false;
    this.selectedProduct = null;
     this.cdr.detectChanges();

  }

  get totalProducts() {
    return this.products.length;
  }

  get lowStock() {
    return this.products.filter(p => p.stock <= p.lowStock).length;
  }
}