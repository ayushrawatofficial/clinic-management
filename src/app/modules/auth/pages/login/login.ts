import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { UserService } from '../../../../core/services/user';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {

  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  async login() {
    try {
      const firebaseUser = await this.auth.login(this.email, this.password);

      // 🔥 fetch user role from DB
      const user = await this.userService.getUserByEmail(firebaseUser.email!);

      if (!user) {
        alert('User not found in system');
        return;
      }

      this.router.navigate(['/home']);
      // 🔥 role-based navigation
      // if (user.role === 'admin') {
      //   this.router.navigate(['/admin']);
      // } else {
      //   this.router.navigate(['/dashboard']);
      // }

    } catch (err: any) {
      alert(err.message);
    }
  }
}