import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { environment } from '../../../environments/environment';
import { getFirestore } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  app = initializeApp(environment.firebase);
  auth = getAuth(this.app);
  db = getFirestore(this.app);   
}