import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PatientService } from '../../../../core/services/patient';
import { ServiceService } from '../../../../core/services/service';
import { ProductService } from '../../../../core/services/product';
import { VisitService } from '../../../../core/services/visit';
import { InvoiceService } from '../../../../core/services/invoice';
import { ToastService } from '../../../../shared/services/toast';

import { SuccessDialogComponent } from '../../../../shared/components/success-dialog/success-dialog';
import { LoaderComponent } from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-add-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, SuccessDialogComponent, LoaderComponent],
  templateUrl: './add-patient.html',
  styleUrls: ['./add-patient.scss']
})
export class AddPatientComponent implements OnInit {

  @Output() onClose = new EventEmitter();

  // ================= PATIENT =================
  mobile = '';
  name = '';
  age: number | null = null;
  gender = 'Male';
  concerns = '';
  referredBy = '';

  patients: any[] = [];
  existingPatient: any = null;

  // ================= PAYMENT =================
  paymentMode = '';
  paymentModes = ['Cash', 'Card', 'UPI'];

  // ================= SERVICES =================
  services: any[] = [];
  filteredServices: any[] = [];
  selectedServices: any[] = [];
  serviceSearch = '';

  // ================= PRODUCTS =================
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedProducts: any[] = [];
  productSearch = '';

  // ================= UI =================
  activeDropdown: 'service' | 'product' | null = null;
  totalAmount = 0;
  saving = false;
  showSuccess = false;
  savedPatient: any;

  submitted = false;

  errors: any = {
    mobile: '',
    name: '',
    age: '',
    paymentMode: ''
  };

  constructor(
    private patientService: PatientService,
    private serviceService: ServiceService,
    private productService: ProductService,
    private visitService: VisitService,
    private invoiceService: InvoiceService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.patientService.getPatients().subscribe(d => this.patients = d || []);
    this.serviceService.getServices().subscribe(d => {
      this.services = d || [];
      this.filteredServices = d || [];
    });
    this.productService.getProducts().subscribe(d => {
      this.products = d || [];
      this.filteredProducts = d || [];
    });
  }

  // ================= INPUT HANDLING =================

  onMobileInput(event: any) {
    const input = event.target;
    let val = input.value.replace(/\D/g, ''); // only digits
    val = val.substring(0, 10); // max 10 digits

    // Update the input value if it changed
    if (val !== input.value) {
      input.value = val;
    }
    this.mobile = val;

    this.errors.mobile = '';
    if (val && val.length !== 10) {
      this.errors.mobile = 'Enter valid 10 digit mobile';
    }

    if (val.length === 10) {
      const found = this.patients.find(p => p.mobile === val);
      if (found) {
        this.existingPatient = found;
        this.name = found.name;
        this.age = found.age;
        this.gender = found.gender;
        this.concerns = found.concerns;
        this.referredBy = found.referredBy;
      } else {
        this.existingPatient = null;
      }
    }
  }

  onMobileKeyPress(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow only numbers (48-57 are 0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onAgeInput(event: any) {
    const input = event.target;
    let val = input.value.replace(/\D/g, ''); // only digits
    val = val.substring(0, 3); // max 3 digits

    // Update the input value if it changed
    if (val !== input.value) {
      input.value = val;
    }

    const numVal = val === '' ? null : Number(val);
    this.age = numVal;

    this.errors.age = '';
    if (this.age === null || this.age === undefined) {
      this.errors.age = 'Age required';
    } else if (this.age < 1 || this.age > 120) {
      this.errors.age = 'Age must be between 1-120';
    }
  }

  onAgeKeyPress(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // ================= VALIDATION =================

  validate(): boolean {

    this.errors = { mobile: '', name: '', age: '', paymentMode: '' };

    this.mobile = (this.mobile || '').replace(/\D/g, '').slice(0, 10);
    this.name = (this.name || '').trim();
    this.age = this.age === null || this.age === undefined ? null : Number(this.age);

    if (!this.mobile || this.mobile.length !== 10) {
      this.errors.mobile = 'Enter valid 10 digit mobile';
    }

    if (!this.name) {
      this.errors.name = 'Name required';
    }

    if (!this.age) {
      this.errors.age = 'Age required';
    } else if (this.age < 1 || this.age > 120) {
      this.errors.age = 'Age must be between 1-120';
    }

    // Payment mode required if services or products selected
    const hasServicesOrProducts = this.selectedServices.length > 0 || this.selectedProducts.length > 0;
    if (hasServicesOrProducts && !this.paymentMode) {
      this.errors.paymentMode = 'Payment mode required when services/products selected';
    }

    return !this.errors.mobile && !this.errors.name && !this.errors.age && !this.errors.paymentMode;
  }

  // ================= DROPDOWN =================

  openServiceDropdown(e: Event) {
    e.stopPropagation();
    this.activeDropdown = this.activeDropdown === 'service' ? null : 'service';
  }

  openProductDropdown(e: Event) {
    e.stopPropagation();
    this.activeDropdown = this.activeDropdown === 'product' ? null : 'product';
  }

  @HostListener('document:click')
  closeDropdown() {
    this.activeDropdown = null;
  }

  // ================= SERVICES =================

  filterServices() {
    const t = this.serviceSearch.toLowerCase();
    this.filteredServices = this.services.filter(s =>
      s.name.toLowerCase().includes(t)
    );
  }

  toggleService(s: any) {
    const exists = this.selectedServices.find(x => x.id === s.id);
    this.selectedServices = exists
      ? this.selectedServices.filter(x => x.id !== s.id)
      : [...this.selectedServices, s];

    this.calculateTotal();
  }

  isSelected(s: any) {
    return this.selectedServices.some(x => x.id === s.id);
  }

  remove(s: any) {
    this.selectedServices = this.selectedServices.filter(x => x.id !== s.id);
    this.calculateTotal();
  }

  // ================= PRODUCTS =================

  filterProducts() {
    const t = this.productSearch.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(t)
    );
  }

  addProduct(p: any) {
    if (p.stock === 0) return;

    const existing = this.selectedProducts.find(x => x.id === p.id);

    if (existing) {
      if (existing.qty < p.stock) existing.qty++;
    } else {
      this.selectedProducts.push({ ...p, qty: 1 });
    }

    this.calculateTotal();
  }

  removeProduct(p: any) {
    this.selectedProducts = this.selectedProducts.filter(x => x.id !== p.id);
    this.calculateTotal();
  }

  increaseQty(p: any) {
    if (p.qty < p.stock) p.qty++;
    this.calculateTotal();
  }

  decreaseQty(p: any) {
    if (p.qty > 1) p.qty--;
    this.calculateTotal();
  }

  isProductSelected(p: any) {
    return this.selectedProducts.some(x => x.id === p.id);
  }

  // ================= TOTAL =================

  calculateTotal() {
    const serviceTotal = this.selectedServices.reduce((sum, s) =>
      sum + Number(s.price || s.finalPrice || 0), 0);

    const productTotal = this.selectedProducts.reduce((sum, p) =>
      sum + (p.price * p.qty), 0);

    this.totalAmount = serviceTotal + productTotal;
  }

  // ================= SAVE =================

  async save() {

    if (this.saving) return;

    this.submitted = true;

    if (!this.validate()) return;

    this.saving = true;

    try {

      let patientId = '';
      let patientCode = '';

      // ONLY BLOCKING CALL
      if (this.existingPatient) {
        patientId = this.existingPatient.id;
        patientCode = this.existingPatient.patientCode;
      } else {

        const patient = {
          name: this.name,
          age: this.age,
          gender: this.gender,
          mobile: this.mobile,
          concerns: this.concerns,
          referredBy: this.referredBy,
          createdAt: new Date().toISOString(),
          patientCode: `PAT-${Date.now()}`
        };

        const res = await this.patientService.addPatient(patient);

        patientId = res.id;
        patientCode = patient.patientCode;
      }

      const services = this.selectedServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.finalPrice ?? s.price,
        originalPrice: s.price ?? s.finalPrice,
        discountValue: s.discountValue ?? 0,
        discountType: s.discountType,
        total: s.finalPrice ?? s.price
      }));

      const products = this.selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        qty: p.qty,
        total: p.price * p.qty
      }));

      const invoiceData = {
        patientId,
        patientCode,
        name: this.name,
        mobile: this.mobile,
        services,
        products,
        total: this.totalAmount,
        paymentMode: this.paymentMode,
        invoiceNumber: `INV-${Date.now()}`,
        date: new Date()
      };

      await Promise.all([
        this.visitService.addVisit({
          patientId,
          visitDate: new Date().toISOString(),
          services,
          products,
          total: this.totalAmount
        }),
        this.invoiceService.createInvoice({
          ...invoiceData,
          createdAt: new Date().toISOString()
        }),
        ...this.selectedProducts.map(p =>
          this.productService.updateProduct(p.id, {
            stock: p.stock - p.qty
          })
        )
      ]);

      this.savedPatient = invoiceData;
      this.showSuccess = true;
      this.toast.show('Patient registered successfully', 'success');
      this.saving = false;

    } catch (e) {
      console.error(e);
      this.saving = false;
      this.toast.show('Error saving patient. Please try again.', 'error');
    }
  }

  close(): void {
    this.onClose.emit();
  }
}