import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ElementRef,
  HostListener
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { PatientService } from '../../../../core/services/patient';
import { ServiceService } from '../../../../core/services/service';
import { VisitService } from '../../../../core/services/visit';
import { SuccessDialogComponent } from '../../../../shared/components/success-dialog/success-dialog';
import { InvoiceService } from '../../../../core/services/invoice';

@Component({
  selector: 'app-add-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, SuccessDialogComponent],
  templateUrl: './add-patient.html',
  styleUrls: ['./add-patient.scss']
})
export class AddPatientComponent implements OnInit {

  @Output() onClose = new EventEmitter();

  mobile = '';
  name = '';
  age: number | null = null;
  gender = 'Male';
  concerns = '';
  referredBy = '';

  patients: any[] = [];
  existingPatient: any = null;

  services: any[] = [];
  filteredServices: any[] = [];
  selectedServices: any[] = [];

  showDropdown = false;
  search = '';
  saving = false;

  totalAmount = 0;

  submitted = false;

  errors: any = {
    mobile: '',
    name: '',
    age: ''
  };

  showSuccess = false;
  savedPatient: any;

  constructor(
    private patientService: PatientService,
    private visitService: VisitService,
    private serviceService: ServiceService,
    private el: ElementRef,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit() {
    this.patientService.getPatients().subscribe(data => {
      this.patients = data || [];
    });

    this.serviceService.getServices().subscribe(data => {
      this.services = data || [];
      this.filteredServices = data || [];
    });
  }

  // 🔥 LIVE VALIDATION
  validateField(field: string) {

    if (field === 'mobile') {
      this.errors.mobile =
        this.mobile.length !== 10 ? 'Enter valid 10 digit mobile' : '';
    }

    if (field === 'name') {
      this.errors.name =
        !this.name.trim() ? 'Name is required' : '';
    }

    if (field === 'age') {
      this.errors.age =
        !this.age ? 'Age required' : '';
    }
  }

  validate() {
    this.validateField('mobile');
    this.validateField('name');
    this.validateField('age');

    return !this.errors.mobile && !this.errors.name && !this.errors.age;
  }

  // 🔒 MOBILE STRICT INPUT
  onMobileInput(event: any) {
    const val = event.target.value.replace(/\D/g, '').slice(0, 10);
    this.mobile = val;

    this.validateField('mobile');

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

  // 🔒 AGE STRICT INPUT
  onAgeInput(event: any) {
  const val = event.target.value.replace(/\D/g, '').slice(0, 3);
  this.age = val ? Number(val) : null;

  this.validateField('age');
}

  openDropdown(e: Event) {
    e.stopPropagation();
    this.showDropdown = true;
  }

  filter() {
    const term = this.search.toLowerCase();
    this.filteredServices = this.services.filter(s =>
      s.name.toLowerCase().includes(term)
    );
  }

  toggle(service: any) {
  const exists = this.selectedServices.find(s => s.id === service.id);

  if (exists) {
    this.selectedServices = this.selectedServices.filter(s => s.id !== service.id);
  } else {
    this.selectedServices.push(service);
  }

  this.calculateTotal();
}

  remove(service: any) {
    this.selectedServices = this.selectedServices.filter(s => s.id !== service.id);
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalAmount = this.selectedServices.reduce((sum, s) => {
      return sum + Number(s.price || s.finalPrice || 0);
    }, 0);
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.select') && !target.closest('.dropdown')) {
      this.showDropdown = false;
    }
  }

  generateId() {
    return `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  async save() {

  this.submitted = true;

  if (!this.validate()) return;

  this.saving = true;

  try {

    let patientId = '';
    let patientCode = '';

    // ✅ STEP 1: SAVE PATIENT ONLY (FAST)
    if (this.existingPatient) {
      patientId = this.existingPatient.id;
      patientCode = this.existingPatient.patientCode;
    } else {
      const patient = {
        name: this.name,
        age: this.age || 0,
        gender: this.gender,
        mobile: this.mobile,
        concerns: this.concerns,
        referredBy: this.referredBy,
        createdAt: new Date().toISOString(),
        patientCode: this.generateId()
      };

      const res = await this.patientService.addPatient(patient);

      patientId = res.id;
      patientCode = patient.patientCode;
    }

    // ✅ PREPARE DATA
    const services = this.selectedServices.map(s => ({
      id: s.id,
      name: s.name,
      price: Number(s.price || s.finalPrice || 0)
    }));

    const invoiceData = {
      patientId,
      name: this.name,
      mobile: this.mobile,
      services,
      total: this.totalAmount,
      invoiceNumber: `INV-${Date.now()}`
    };

    // ✅ STEP 2: SHOW SUCCESS IMMEDIATELY
    this.savedPatient = invoiceData;
    this.showSuccess = true;
    this.saving = false;

    // 🚀 STEP 3: BACKGROUND TASKS (NON BLOCKING)
    setTimeout(async () => {

      try {
        await this.visitService.addVisit({
          patientId,
          visitDate: new Date().toISOString(),
          services,
          total: this.totalAmount
        });
      } catch (e) {
        console.warn('Visit failed:', e);
      }

      try {
        await this.invoiceService.createInvoice({
          ...invoiceData,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Invoice failed:', e);
      }

    }, 0);

  } catch (e) {
    console.error(e);
    alert(JSON.stringify(e));
    this.saving = false;
  }
}
  generateInvoiceNumber() {
  return `INV-${Date.now()}`;
}

isSelected(service: any): boolean {
  return this.selectedServices.some(s => s.id === service.id);
}

  close() {
    this.onClose.emit();
  }
}