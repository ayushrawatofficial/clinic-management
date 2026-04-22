import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VisitService {

  constructor(private firestore: Firestore) {}

  // 🔥 GET ALL VISITS
  getVisits(): Observable<any[]> {
    const ref = collection(this.firestore, 'visits');
    return collectionData(ref, { idField: 'id' }) as Observable<any[]>;
  }

  // 🔥 ADD VISIT
  async addVisit(data: any) {
    const ref = collection(this.firestore, 'visits');
    return await addDoc(ref, data);
  }
}