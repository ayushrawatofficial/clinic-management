import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './add-user-dialog.html',
  styleUrls: ['./add-user-dialog.scss']
})
export class AddUserDialogComponent implements OnInit {

  @Input() data: any;
  @Input() loading = false;

  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  name = '';
  email = '';
  role = 'receptionist';

  submitted = false;

  ngOnInit() {
    if (this.data) {
      this.name = this.data.name;
      this.email = this.data.email;
      this.role = this.data.role;
    }
  }

  get isValid() {
    return this.name.trim() !== '' && this.isEmailValid;
  }

  get isEmailValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  save() {
    this.submitted = true;

    if (!this.isValid || this.loading) return;

    this.onSave.emit({
      name: this.name.trim(),
      email: this.email.trim(),
      role: this.role,
      createdAt: new Date()
    });
  }

  close() {
    this.onClose.emit();
  }
}