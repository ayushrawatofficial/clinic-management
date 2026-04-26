import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../../core/services/patient';
import { LoaderService } from '../../../../shared/services/loader';
import { ToastService } from '../../../../shared/services/toast';
import { CLINIC_CONFIG } from '../../../../core/config/clinic.config';

@Component({
  selector: 'app-whatsapp-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broadcast.html',
  styleUrls: ['./broadcast.scss']
})
export class WhatsAppBroadcastComponent implements OnInit {
  private readonly storageKey = 'wa_broadcast_sets_v1';
  patients: any[] = [];
  visiblePatients: any[] = [];
  selectedPatientIds = new Set<string>();
  savedSets: Array<{ name: string; ids: string[] }> = [];
  selectedSetName = '';

  search = '';
  readonly pageSize = 100;
  displayedCount = 100;

  message = `Hello from ${CLINIC_CONFIG.name}.`;
  imageName = '';

  constructor(
    private patientService: PatientService,
    private loader: LoaderService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSavedSets();
    this.loadPatients();
  }

  loadPatients() {
    this.loader.show();
    this.patientService.getPatients().subscribe({
      next: (data: any[]) => {
        this.patients = (data || [])
          .map(p => ({ ...p, mobile: p.mobile || '' }))
          .sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));

        this.selectedPatientIds = new Set(this.patients.filter(p => this.isValidMobile(p.mobile)).map(p => p.id));
        this.applyFilter();
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.toast.show('Failed to load patients', 'error');
      }
    });
  }

  applyFilter() {
    const term = (this.search || '').toLowerCase().trim();
    const filtered = !term
      ? this.patients
      : this.patients.filter(p =>
          (p.name || '').toLowerCase().includes(term) ||
          (p.mobile || '').includes(term) ||
          (p.patientCode || '').toLowerCase().includes(term)
        );

    this.displayedCount = Math.min(this.pageSize, filtered.length);
    this.visiblePatients = filtered.slice(0, this.displayedCount);
  }

  onPatientsScroll(event: Event) {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (!nearBottom) return;

    const term = (this.search || '').toLowerCase().trim();
    const filtered = !term
      ? this.patients
      : this.patients.filter(p =>
          (p.name || '').toLowerCase().includes(term) ||
          (p.mobile || '').includes(term) ||
          (p.patientCode || '').toLowerCase().includes(term)
        );

    if (this.displayedCount >= filtered.length) return;
    this.displayedCount = Math.min(this.displayedCount + this.pageSize, filtered.length);
    this.visiblePatients = filtered.slice(0, this.displayedCount);
  }

  togglePatientSelection(id: string, selected: boolean) {
    if (selected) this.selectedPatientIds.add(id);
    else this.selectedPatientIds.delete(id);
  }

  toggleSelectAll(select: boolean) {
    if (select) {
      this.selectedPatientIds = new Set(this.patients.filter(p => this.isValidMobile(p.mobile)).map(p => p.id));
    } else {
      this.selectedPatientIds.clear();
    }
  }

  handleImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.imageName = file ? file.name : '';
  }

  async copyMessage() {
    try {
      await navigator.clipboard.writeText(this.message || '');
      this.toast.show('Message copied. Paste in WhatsApp.', 'success');
    } catch {
      this.toast.show('Copy failed. Please copy manually.', 'error');
    }
  }

  openWhatsApp() {
    const selected = this.patients.filter(p => this.selectedPatientIds.has(p.id) && this.isValidMobile(p.mobile));
    if (!selected.length) {
      this.toast.show('Select at least one patient with valid mobile.', 'error');
      return;
    }

    const numbers = selected.map(p => String(p.mobile).replace(/\D/g, '')).filter(Boolean);
    const msg = (this.message || '').trim() || `Hello from ${CLINIC_CONFIG.name}.`;

    const url = numbers.length === 1
      ? `https://wa.me/${numbers[0]}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
    this.toast.show('WhatsApp opened. Attach media manually if needed.', 'warning');
  }

  saveAsNewSet() {
    const name = window.prompt('Enter new broadcast set name');
    if (!name || !name.trim()) return;

    const trimmed = name.trim();
    const existing = this.savedSets.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      this.toast.show('Set name already exists. Use update instead.', 'error');
      return;
    }

    const ids = Array.from(this.selectedPatientIds);
    this.savedSets.push({ name: trimmed, ids });
    this.persistSavedSets();
    this.selectedSetName = trimmed;
    this.toast.show('Broadcast set created', 'success');
  }

  updateSelectedSet() {
    if (!this.selectedSetName) {
      this.toast.show('Select a set to update', 'error');
      return;
    }

    const ids = Array.from(this.selectedPatientIds);
    this.savedSets = this.savedSets.map(s => s.name === this.selectedSetName ? { ...s, ids } : s);
    this.persistSavedSets();
    this.toast.show('Broadcast set updated', 'success');
  }

  applySet() {
    if (!this.selectedSetName) return;
    const set = this.savedSets.find(s => s.name === this.selectedSetName);
    if (!set) return;

    this.selectedPatientIds = new Set(set.ids);
    this.toast.show('Broadcast set applied', 'warning');
  }

  deleteSelectedSet() {
    if (!this.selectedSetName) {
      this.toast.show('Select a set to delete', 'error');
      return;
    }

    this.savedSets = this.savedSets.filter(s => s.name !== this.selectedSetName);
    this.persistSavedSets();
    this.selectedSetName = '';
    this.toast.show('Broadcast set deleted', 'warning');
  }

  get selectedCount() {
    return this.selectedPatientIds.size;
  }

  private isValidMobile(mobile: string): boolean {
    const digits = String(mobile || '').replace(/\D/g, '');
    return digits.length === 10;
  }

  private getLatestDateMs(record: any): number {
    const createdAtMs = record?.createdAt ? new Date(record.createdAt).getTime() : 0;
    return createdAtMs || 0;
  }

  private loadSavedSets() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.savedSets = raw ? JSON.parse(raw) : [];
    } catch {
      this.savedSets = [];
    }
  }

  private persistSavedSets() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.savedSets));
  }
}

