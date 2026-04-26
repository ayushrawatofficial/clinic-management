import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { UserService } from '../../../../core/services/user';
import { Router } from '@angular/router';
import { CLINIC_CONFIG } from '../../../../core/config/clinic.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule], // @if / @for are built-in — no NgIf/NgFor needed in Angular 17+
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {

  config = CLINIC_CONFIG;

  // Array for @for loop to render EQ bars
  eqBars = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Parse service pills from the comma-separated subjectLine
  services = CLINIC_CONFIG.subjectLine
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  loading = false;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  /** Returns initials from a full name — e.g. "Akshit Dadhich" → "AD" */
  initials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  async login() {
    if (!this.email || !this.password) {
      alert('Please enter your email and password.');
      return;
    }

    this.loading = true;

    try {
      const firebaseUser = await this.auth.login(this.email, this.password);
      const user = await this.userService.getUserByEmail(firebaseUser.email!);

      if (!user) {
        alert('User not found in system.');
        return;
      }

      if (user.role === 'admin') {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }

    } catch (err: any) {
      alert(err.message ?? 'Login failed. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  forgotPassword() {
    alert(`Contact admin at ${this.config.email} to reset your password.`);
  }
}