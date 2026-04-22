import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);
  const auth = inject(Auth);

  return new Promise<boolean>((resolve) => {

    onAuthStateChanged(auth, (user) => {

      if (user) {
        resolve(true);
      } else {
        router.navigate(['/']);
        resolve(false);
      }

    });

  });

};