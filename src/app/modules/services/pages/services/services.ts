import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ServiceService } from '../../../../core/services/service';
import { LoaderService } from '../../../../shared/services/loader';
import { ToastService } from '../../../../shared/services/toast';
import { AddServiceDialogComponent } from '../../components/add-service-dialog/add-service-dialog';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, AddServiceDialogComponent],
  templateUrl: './services.html',
  styleUrls: ['./services.scss']
})
export class ServicesComponent implements OnInit, OnDestroy {

  services: any[] = [];
  filtered: any[] = [];
  visibleFiltered: any[] = [];

  showDialog = false;
  editData: any = null;

  dialogLoading = false;

  filters = {
    name: '',
    category: '',
    price: '',
    discount: '',
    finalPrice: '',
    description:''
  };

  sub!: Subscription;
  readonly pageSize = 100;
  displayedCount = 100;

  // 🔥 BULK FEATURE
  bulkType: 'percent' | 'flat' = 'percent';
  bulkValue: any = '';
  bulkExpiry: any = '';

  // 🔥 CHECKBOX STATE
  isAllSelected = false;
  isIndeterminate = false;

  // 🔥 DATE (block past)
  today = new Date().toISOString().split('T')[0];

  constructor(
    private serviceService: ServiceService,
    private toast: ToastService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.loader.show();

    this.sub = this.serviceService.getServices().subscribe(async data => {

      const now = new Date();

      // 🔥 AUTO EXPIRY RESET
      const updatePromises: Promise<void>[] = [];
      data.forEach(s => {

        if (s.discountExpiry) {

          const expiry = new Date(s.discountExpiry);

          if (expiry < now && s.discountValue > 0) {

            updatePromises.push(this.serviceService.updateService(s.id, {
              discountValue: 0,
              finalPrice: s.price,
              discountExpiry: null
            }).catch(error => console.error('Error updating service:', error)));
          }
        }

        // 🔥 DEFAULT SELECT FLAG
        if (s.selected === undefined) {
          s.selected = false;
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      this.services = (data || []).sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));
      this.applyFilter();

      this.loader.hide();
      this.cdr.detectChanges();
    }, error => {
      console.error('Error loading services:', error);
      this.loader.hide();
      this.toast.show('Failed to load services', 'error');
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get totalServices() {
    return this.services.length;
  }

  applyFilter() {
    this.filtered = this.services.filter(s =>
      (!this.filters.name || s.name?.toLowerCase().includes(this.filters.name.toLowerCase())) &&
      (!this.filters.category || s.category?.toLowerCase().includes(this.filters.category.toLowerCase())) &&
      (!this.filters.price || String(s.price).includes(this.filters.price)) &&
      (!this.filters.description || String(s.description).includes(this.filters.description)) &&
      (!this.filters.discount || String(s.discountValue).includes(this.filters.discount)) &&
      (!this.filters.finalPrice || String(s.finalPrice).includes(this.filters.finalPrice))
    );

    this.filtered.sort((a, b) => this.getLatestDateMs(b) - this.getLatestDateMs(a));
    this.resetVisibleData();

    this.updateSelectionState();
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

  private getLatestDateMs(service: any): number {
    return service?.createdAt ? new Date(service.createdAt).getTime() : 0;
  }

  openDialog(data: any = null) {
    this.editData = data;
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.editData = null;
    this.dialogLoading = false;
    this.cdr.detectChanges();
  }

  async handleSave(data: any) {

    this.dialogLoading = true;
    this.loader.show();

    try {

      const isDuplicate = this.services.some(s =>
        s.name?.trim().toLowerCase() === data.name?.trim().toLowerCase() &&
        s.id !== this.editData?.id
      );

      if (isDuplicate) {
        this.toast.show('Service already exists', 'error');
         this.dialogLoading = false;
        return;
      }
this.loader.show();

      if (this.editData) {
        await this.serviceService.updateService(this.editData.id, data);
        this.toast.show('Service updated successfully', 'warning');
      } else {
        await this.serviceService.addService(data);
        this.toast.show('Service added successfully', 'success');
      }

      this.closeDialog();

    } catch {
      this.toast.show('Something went wrong', 'error');
    } finally {
      this.dialogLoading = false;
      this.loader.hide();
    }
  }

  async delete(id: string) {
    this.loader.show();

    await this.serviceService.deleteService(id);

    this.toast.show('Service deleted successfully', 'error');

    this.cdr.detectChanges();
    this.loader.hide();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  // 🔥 CHECKBOX LOGIC

  toggleAll(event: any) {
    const checked = event.target.checked;

    this.filtered.forEach(s => s.selected = checked);

    this.updateSelectionState();
  }

  updateSelectionState() {
    const selected = this.selectedServices.length;
    const total = this.filtered.length;

    this.isAllSelected = selected === total && total > 0;
    this.isIndeterminate = selected > 0 && selected < total;
  }

  get selectedServices() {
    return this.services.filter(s => s.selected);
  }

  // 🔥 BULK APPLY

  async applyBulkDiscount() {

    if (!this.bulkValue) {
      this.toast.show('Enter discount value', 'error');
      return;
    }

    this.loader.show();

    try {

      const updates = this.selectedServices.map(s => {

        let final = s.price;

        if (this.bulkType === 'percent') {
          final = s.price - (s.price * this.bulkValue / 100);
        } else {
          final = s.price - this.bulkValue;
        }

        return this.serviceService.updateService(s.id, {
          discountType: this.bulkType,
          discountValue: this.bulkValue,
          finalPrice: final,
          discountExpiry: this.bulkExpiry || null
        });
      });

      await Promise.all(updates);

      this.toast.show('Bulk discount applied', 'success');

      // 🔥 RESET
      this.bulkValue = '';
      this.bulkExpiry = '';
      this.filtered.forEach(s => s.selected = false);

      this.updateSelectionState();

    } catch {
      this.toast.show('Error applying discount', 'error');
    } finally {
      this.loader.hide();
    }
  }
}