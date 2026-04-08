import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-service-dialog',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './add-service-dialog.html',
  styleUrls: ['./add-service-dialog.scss']
})
export class AddServiceDialogComponent implements OnInit {

  @Input() data: any;
  @Input() loading = false;

  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  name = '';
  category = '';
  description = '';
  price: number | null = null;
  discountType: 'percent' | 'flat' = 'percent';
  discountValue = 0;

  submitted = false;
constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.data) {
      this.name = this.data.name;
      this.category = this.data.category;
      this.description = this.data.description;
      this.price = this.data.price;
      this.discountType = this.data.discountType;
      this.discountValue = this.data.discountValue;
    }
  }

  get isValid() {
    return this.name.trim() !== '' && this.price !== null && this.price > 0;
  }

  get finalPrice() {
    if (!this.price) return 0;
    return this.discountType === 'percent'
      ? this.price - (this.price * this.discountValue / 100)
      : this.price - this.discountValue;
  }

 save() {
  this.submitted = true;

  if (!this.isValid || this.loading) return;

  this.onSave.emit({
    name: this.name.trim(),
    category: this.category,
    description: this.description,
    price: this.price,
    discountType: this.discountType,
    discountValue: this.discountValue,
    finalPrice: this.finalPrice,
    createdAt: new Date()
  });
}


  close() {
    this.onClose.emit();
  }
}