import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AddPatientComponent } from '../add-patient/add-patient';
import { PatientService } from '../../../../core/services/patient';
import { VisitService } from '../../../../core/services/visit';
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

  search = '';
  showDialog = false;

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
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private loader: LoaderService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  // 🔥 LOAD BOTH PATIENTS + VISITS
  loadData() {
  this.loader.show();
  this.patientService.getPatients().subscribe((patients: any[]) => {

    this.visitService.getVisits().subscribe((visits: any[]) => {

      this.patients = patients || [];

      this.patients = this.patients.map(p => {

        const patientVisits = visits
          .filter(v => v.patientId === p.id)
          .sort((a, b) =>
            new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
          );

        return {
          ...p,
          lastVisit: patientVisits.length ? patientVisits[0].visitDate : null
        };
      });

      this.applyFilter();
      
      this.loader.hide();
      this.cdr.detectChanges();
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