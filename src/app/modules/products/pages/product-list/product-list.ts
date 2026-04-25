import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../../core/services/product';
import { AddProductComponent } from '../add-product/add-product';

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

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.productService.getProducts().subscribe(data => {
      this.products = data || [];
      this.applyFilter();
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

  openAdd() {
    this.selectedProduct = null;
    this.showDialog = true;
  }

  openEdit(p: any) {
    this.selectedProduct = p;
    this.showDialog = true;
  }

  async delete(p: any) {
    if (!confirm('Delete product?')) return;
    await this.productService.deleteProduct(p.id);
  }

  closeDialog() {
    this.showDialog = false;
    this.selectedProduct = null;
  }

  get totalProducts() {
    return this.products.length;
  }

  get lowStock() {
    return this.products.filter(p => p.stock <= p.lowStock).length;
  }
}