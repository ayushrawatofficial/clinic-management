import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../../core/services/product';
import { AddProductComponent } from '../add-product/add-product';
import { ToastService } from '../../../../shared/services/toast';
import { LoaderService } from '../../../../shared/services/loader';

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

  showDialog = false;
  selectedProduct: any = null;

  search = '';

  filters = {
  name: '',
  desc: '',
  price: '',
  stock: '',
  status: ''
};

  constructor(private productService: ProductService,
    private toast: ToastService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loader.show();
    this.productService.getProducts().subscribe(data => {
      this.products = data || [];
      this.applyFilter();

      this.loader.hide();
      this.cdr.detectChanges();
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
  }

  openDialog(data: any = null) {
    this.selectedProduct = data;
    this.showDialog = true;
  }

  async delete(p: any) {
    this.loader.show();
    await this.productService.deleteProduct(p.id);
    this.toast.show('Service deleted', 'error');

    this.loader.hide();
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