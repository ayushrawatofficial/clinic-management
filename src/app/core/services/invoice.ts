import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  collectionData
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

  constructor(private firestore: Firestore) {}

  // 🔥 CREATE
  async createInvoice(data: any) {
    const ref = collection(this.firestore, 'invoices');
    return addDoc(ref, data);
  }

  async updateInvoice(id: string, data: Record<string, unknown>) {
    const ref = doc(this.firestore, 'invoices', id);
    return updateDoc(ref, data);
  }

 // 🔥 GET INVOICES BY PATIENT CODE
  getInvoicesByPatientCode(code: string) {
    const ref = collection(this.firestore, 'invoices');
    const q = query(ref, where('patientCode', '==', code), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // 🔥 GET ALL INVOICES
  getAllInvoices() {
    const ref = collection(this.firestore, 'invoices');
    const q = query(ref, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  


}