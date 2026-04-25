import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, collectionData } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

  constructor(private firestore: Firestore) {}

  // 🔥 CREATE
  async createInvoice(data: any) {
    const ref = collection(this.firestore, 'invoices');
    return addDoc(ref, data);
  }

  // 🔥 GET BY PATIENT CODE (FINAL)
  getInvoicesByPatientCode(code: string) {

    const ref = collection(this.firestore, 'invoices');

    const q = query(ref, where('patientCode', '==', code));

    return collectionData(q, { idField: 'id' });
  }

}