import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user';
import { Auth } from '@angular/fire/auth';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async () => {
    const router = inject(Router);
    const userService = inject(UserService);
    const auth = inject(Auth);

    const user = auth.currentUser;

    if (!user) {
      router.navigate(['/']);
      return false;
    }

    const dbUser = await userService.getUserByEmail(user.email!);

    if (!dbUser || !allowedRoles.includes(dbUser.role)) {
      alert('Access Denied');
      router.navigate(['/']);
      return false;
    }

    return true;
  };
};