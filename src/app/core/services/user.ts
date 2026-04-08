import { Injectable } from '@angular/core';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import { FirebaseService } from './firebase';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(private firebase: FirebaseService) {}

  getUsers(): Observable<any[]> {
    return new Observable(observer => {
      const ref = collection(this.firebase.db, 'users');

      const unsub = onSnapshot(ref, snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        observer.next(data);
      });

      return () => unsub();
    });
  }
  async getUserByEmail(email: string) {

  const ref = collection(this.firebase.db, 'users');

  const q = query(ref, where('email', '==', email));

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...(doc.data() as any)
    };
  }

  return null;
}

  addUser(data: any) {
    return addDoc(collection(this.firebase.db, 'users'), data);
  }

  updateUser(id: string, data: any) {
    return updateDoc(doc(this.firebase.db, 'users', id), data);
  }

  deleteUser(id: string) {
    return deleteDoc(doc(this.firebase.db, 'users', id));
  }
}