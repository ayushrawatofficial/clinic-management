import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../core/services/product';
import { ToastService } from '../../../../shared/services/toast';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.scss']
})
export class AddProductComponent implements OnInit {

  @Input() product: any = null;
  @Output() onClose = new EventEmitter();

  name = '';
  description = '';
  price: number | null = null;
  stock: number | null = null;
  lowStock: number | null = 5;

  isEdit = false;
  submitted = false;

  allProducts: any[] = [];

  constructor(private productService: ProductService,private toast: ToastService) {}

  ngOnInit() {
    this.productService.getProducts().subscribe(data => {
      this.allProducts = data || [];
    });

    if (this.product) {
      this.isEdit = true;
      this.name = this.product.name;
      this.description = this.product.description || '';
      this.price = this.product.price;
      this.stock = this.product.stock;
      this.lowStock = this.product.lowStock;
    }
  }

  isDuplicate(): boolean {
    const name = this.name.trim().toLowerCase();

    return this.allProducts.some(p =>
      p.name?.toLowerCase() === name &&
      (!this.isEdit || p.id !== this.product?.id)
    );
  }

  isValid(): boolean {
  const hasName = this.name.trim().length > 0;

  return (
    hasName &&
    !this.isDuplicate() &&
    this.price! > 0 &&
    this.stock! >= 0
  );
}

  async save() {
    this.submitted = true;

    if (!this.isValid()) return;

    const payload = {
      name: this.name.trim(),
      description: this.description,
      price: Number(this.price),
      stock: Number(this.stock),
      lowStock: Number(this.lowStock || 5)
    };

    if (this.isEdit) {
      await this.productService.updateProduct(this.product.id, payload);
      this.toast.show('Product updated successfully', 'warning');
    } else {
      await this.productService.addProduct(payload);
      this.toast.show('Product added successfully', 'success');
    }

    this.onClose.emit();
  }

  close() {
    this.onClose.emit();
  }
}