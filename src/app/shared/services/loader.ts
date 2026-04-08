import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  loading = false;

  show() {
    this.loading = true;
  }

  hide() {
    this.loading = false;
  }
}