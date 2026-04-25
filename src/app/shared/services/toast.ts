import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private _toast = new BehaviorSubject<Toast | null>(null);
  toast$ = this._toast.asObservable();

  show(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    this._toast.next({ message, type });

    setTimeout(() => {
      this._toast.next(null);
    }, 2500);
  }
}