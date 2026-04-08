import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserService } from '../../../../core/services/user';
import { LoaderService } from '../../../../shared/services/loader';
import { ToastService } from '../../../../shared/services/toast';
import { AddUserDialogComponent } from '../../components/add-user-dialog/add-user-dialog';
import { User } from '../../../../shared/models/user';


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AddUserDialogComponent],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {

  users: User[] = [];
  filtered: any[] = [];

  showDialog = false;
  editData: any = null;

  dialogLoading = false;

  filters = {
    name: '',
    email: '',
    role: ''
  };

  sub!: Subscription;

  constructor(
    private userService: UserService,
    private loader: LoaderService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loader.show();

    this.sub = this.userService.getUsers().subscribe(data => {
      this.users = data;
      this.applyFilter();
      this.loader.hide();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get totalUsers() {
    return this.users.length;
  }

  applyFilter() {
    this.filtered = this.users.filter(u =>
      (!this.filters.name || u.name?.toLowerCase().includes(this.filters.name.toLowerCase())) &&
      (!this.filters.email || u.email?.toLowerCase().includes(this.filters.email.toLowerCase())) &&
      (!this.filters.role || u.role?.toLowerCase().includes(this.filters.role.toLowerCase()))
    );
  }

  openDialog(data: any = null) {
    this.editData = data;
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.editData = null;
    this.dialogLoading = false;
  }

  async handleSave(data: any) {

  this.dialogLoading = true;

  try {

    // 🔥 DUPLICATE EMAIL CHECK
    const isDuplicate = this.users.some(u =>
      u.email?.toLowerCase() === data.email?.toLowerCase() &&
      u.id !== this.editData?.id
    );

    if (isDuplicate) {
      this.toast.show('Email already exists', 'error');
      this.dialogLoading = false;
      return;
    }

    this.loader.show();

    let payload: any = {
      ...data
    };

    if (!this.editData) {
      // 🔥 ONLY FOR NEW USER
      payload.createdBy = this.getLoggedInUserName();
      payload.createdAt = new Date(); // ✅ timestamp
    }

    if (this.editData) {
      await this.userService.updateUser(this.editData.id, payload);
      this.toast.show('User updated', 'warning');
    } else {
      await this.userService.addUser(payload);
      this.toast.show('User added', 'success');
    }

    this.closeDialog();

  } catch {
    this.toast.show('Error saving user', 'error');
  } finally {
    this.dialogLoading = false;
    this.loader.hide();
  }
}

  async delete(id: string) {
    try {
      this.loader.show();
      await this.userService.deleteUser(id);
      this.toast.show('User deleted', 'error');
    } finally {
      this.loader.hide();
    }
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  getLoggedInUserName(): string {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.email || 'system@local';
}
}