import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

  constructor(private firestore: Firestore) {}

  async createInvoice(data: any) {
    const ref = collection(this.firestore, 'invoices');
    return await addDoc(ref, data);
  }

  getInvoices() {
    const ref = collection(this.firestore, 'invoices');
    return collectionData(ref, { idField: 'id' });
  }
}