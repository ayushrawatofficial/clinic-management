import { Injectable } from '@angular/core';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { FirebaseService } from './firebase';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceService {

  constructor(private firebase: FirebaseService) {}

  getServices(): Observable<any[]> {
    return new Observable(observer => {

      const ref = collection(this.firebase.db, 'services');

      const unsubscribe = onSnapshot(ref, snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        observer.next(data);
      });

      return () => unsubscribe();
    });
  }

  async addService(data: any) {
    const ref = collection(this.firebase.db, 'services');
    return await addDoc(ref, data);
  }

  async updateService(id: string, data: any) {
    const ref = doc(this.firebase.db, 'services', id);
    return await updateDoc(ref, data);
  }

  async deleteService(id: string) {
    const ref = doc(this.firebase.db, 'services', id);
    return await deleteDoc(ref);
  }
}