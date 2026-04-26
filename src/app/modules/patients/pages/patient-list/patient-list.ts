import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { AddPatientComponent } from '../add-patient/add-patient';
import { PatientService } from '../../../../core/services/patient';
import { VisitService } from '../../../../core/services/visit';
import { InvoiceService } from '../../../../core/services/invoice';
import { Router } from '@angular/router';
import { LoaderService } from '../../../../shared/services/loader';
import { ToastService } from '../../../../shared/services/toast';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddPatientComponent],
  templateUrl: './patient-list.html',
  styleUrls: ['./patient-list.scss']
})
export class PatientListComponent implements OnInit {

  patients: any[] = [];
  visits: any[] = [];
  filtered: any[] = [];
  visibleFiltered: any[] = [];

  search = '';
  showDialog = false;
  readonly pageSize = 100;
  displayedCount = 100;

  filters = {
    id: '',
    name: '',
    mobile: '',
    age: '',
    gender: ''
  };

  constructor(
    private patientService: PatientService,
    private visitService: VisitService,
    private invoiceService: InvoiceService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private loader: LoaderService,
  ) {}

  ngOnInit() {
    // Check if we should open the add patient dialog
    this.route.queryParams.subscribe(params => {
      if (params['add'] === 'true') {
        this.showDialog = true;
        // Clean up the URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });

    this.loadData();
  }

  // 🔥 LOAD BOTH PATIENTS + VISITS + INVOICES
  loadData() {
  this.loader.show();
  this.patientService.getPatients().subscribe((patients: any[]) => {

    this.visitService.getVisits().subscribe((visits: any[]) => {

      this.invoiceService.getAllInvoices().subscribe((invoices: any[]) => {

        this.patients = (patients || []).sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));

        this.patients = this.patients.map(p => {

          const patientVisits = visits
            .filter(v => v.patientId === p.id)
            .sort((a, b) =>
              new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
            );

          const patientInvoices = invoices.filter(inv => inv.patientCode === p.patientCode);

          return {
            ...p,
            lastVisit: patientVisits.length ? patientVisits[0].visitDate : null,
            totalInvoices: patientInvoices.length
          };
        });

        this.applyFilter();
        
        this.loader.hide();
        this.cdr.detectChanges();
      });

    });

  });
}

  applyFilter() {

    const term = (this.search || '').toLowerCase();

    this.filtered = this.patients.filter(p => {

      return (
        (!this.filters.id || p.patientCode?.toLowerCase().includes(this.filters.id.toLowerCase())) &&
        (!this.filters.name || p.name?.toLowerCase().includes(this.filters.name.toLowerCase())) &&
        (!this.filters.mobile || p.mobile?.includes(this.filters.mobile)) &&
        (!this.filters.age || p.age?.toString().includes(this.filters.age)) &&
        (!this.filters.gender || p.gender?.toLowerCase().includes(this.filters.gender.toLowerCase())) &&

        (
          (p.name || '').toLowerCase().includes(term) ||
          (p.mobile || '').includes(term) ||
          (p.patientCode || '').toLowerCase().includes(term)
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

  private getLatestDateMs(patient: any): number {
    const lastVisitMs = patient?.lastVisit ? new Date(patient.lastVisit).getTime() : 0;
    const createdAtMs = patient?.createdAt ? new Date(patient.createdAt).getTime() : 0;
    return Math.max(lastVisitMs || 0, createdAtMs || 0);
  }

  openPatient(patient: any) {
  if (!patient?.patientCode) {
    alert('Patient code missing. Please refresh or fix data.');
    return;
  }

  this.router.navigate(['/patients', patient.patientCode]);
}
  openDialog() {
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.loadData();
  }

  get totalPatients() {
    return this.patients.length;
  }

  get patientsToday() {
    const today = new Date().toDateString();
    return this.patients.filter(p =>
      new Date(p.createdAt).toDateString() === today
    ).length;
  }

  get patientsThisMonth() {
    const now = new Date();
    return this.patients.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth();
    }).length;
  }
}