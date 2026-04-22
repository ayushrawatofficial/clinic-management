import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';


@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private auth: Auth) {}

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    return userCredential.user; // 🔥 return user
  }
}