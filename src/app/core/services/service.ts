import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  collectionData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {

  constructor(private firestore: Firestore) {}

  // 🔥 GET (REAL-TIME)
  getServices(): Observable<any[]> {
    const ref = collection(this.firestore, 'services');
    return collectionData(ref, { idField: 'id' });
  }

  // 🔥 ADD
  async addService(data: any) {
    const ref = collection(this.firestore, 'services');
    return await addDoc(ref, data);
  }

  // 🔥 UPDATE
  async updateService(id: string, data: any) {
    const ref = doc(this.firestore, 'services', id);
    return await updateDoc(ref, data);
  }

  // 🔥 DELETE
  async deleteService(id: string) {
    const ref = doc(this.firestore, 'services', id);
    return await deleteDoc(ref);
  }
}