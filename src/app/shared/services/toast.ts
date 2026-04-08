import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {

  message = '';
  type: 'success' | 'error' | 'warning' = 'success';
  showToast = false;

  show(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    
    this.showToast = false; // 🔥 RESET FIRST

    setTimeout(() => {
      this.message = msg;
      this.type = type;
      this.showToast = true;

      setTimeout(() => {
        this.showToast = false;
      }, 2500);

    }, 10);
  }
}