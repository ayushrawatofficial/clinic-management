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

@Injectable({ providedIn: 'root' })
export class ProductService {

  constructor(private firestore: Firestore) {}

  // ✅ GET PRODUCTS
  getProducts(): Observable<any[]> {
    const ref = collection(this.firestore, 'products');
    return collectionData(ref, { idField: 'id' }) as Observable<any[]>;
  }

  // ✅ ADD PRODUCT
  async addProduct(data: any) {
    const ref = collection(this.firestore, 'products');
    return await addDoc(ref, {
      ...data,
      createdAt: new Date().toISOString()
    });
  }

  // ✅ UPDATE
  async updateProduct(id: string, data: any) {
    const ref = doc(this.firestore, 'products', id);
    return await updateDoc(ref, data);
  }

  // ✅ DELETE
  async deleteProduct(id: string) {
    const ref = doc(this.firestore, 'products', id);
    return await deleteDoc(ref);
  }
}