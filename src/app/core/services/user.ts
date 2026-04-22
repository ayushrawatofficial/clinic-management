import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  collectionData,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore) {}

  // 🔥 REAL-TIME USERS
  getUsers(): Observable<any[]> {
    const ref = collection(this.firestore, 'users');
    return collectionData(ref, { idField: 'id' });
  }

  // 🔍 GET USER BY EMAIL
  async getUserByEmail(email: string) {

    const ref = collection(this.firestore, 'users');
    const q = query(ref, where('email', '==', email));

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return {
        id: docSnap.id,
        ...(docSnap.data() as any)
      };
    }

    return null;
  }

  // ➕ ADD USER
  async addUser(data: any) {
    const ref = collection(this.firestore, 'users');
    return await addDoc(ref, data);
  }

  // ✏️ UPDATE USER
  async updateUser(id: string, data: any) {
    const ref = doc(this.firestore, 'users', id);
    return await updateDoc(ref, data);
  }

  // 🗑 DELETE USER
  async deleteUser(id: string) {
    const ref = doc(this.firestore, 'users', id);
    return await deleteDoc(ref);
  }
}