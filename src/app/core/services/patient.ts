import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  constructor(private firestore: Firestore) {}

  // 🔥 GET PATIENTS
  getPatients(): Observable<any[]> {
    const ref = collection(this.firestore, 'patients');
    return collectionData(ref, { idField: 'id' });
  }

  // 🔥 ADD PATIENT
  async addPatient(data: any) {
    const ref = collection(this.firestore, 'patients');
    return await addDoc(ref, data);
  }
}