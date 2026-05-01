import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  collectionData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export type RepairJobStatus = 'inward' | 'outward';

@Injectable({ providedIn: 'root' })
export class RepairService {
  constructor(private firestore: Firestore) {}

  getRepairJobs(): Observable<any[]> {
    const ref = collection(this.firestore, 'repair_jobs');
    return collectionData(ref, { idField: 'id' });
  }

  async addRepairJob(data: Record<string, unknown>) {
    const ref = collection(this.firestore, 'repair_jobs');
    return await addDoc(ref, data);
  }

  async updateRepairJob(id: string, data: Record<string, unknown>) {
    const ref = doc(this.firestore, 'repair_jobs', id);
    return await updateDoc(ref, data);
  }
}
