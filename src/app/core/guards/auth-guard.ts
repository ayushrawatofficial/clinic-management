import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const firebase = inject(FirebaseService);

  return new Promise((resolve) => {
    firebase.auth.onAuthStateChanged(user => {
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/']);
        resolve(false);
      }
    });
  });
};