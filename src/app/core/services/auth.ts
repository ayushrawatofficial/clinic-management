import { Injectable } from '@angular/core';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseService } from './firebase';


@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private firebase: FirebaseService) {}

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      this.firebase.auth,
      email,
      password
    );

    return userCredential.user; // 🔥 return user
  }
}