import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Auth, signOut } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

import { UserService } from '../../../core/services/user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  userName = '';
  role = '';
  time = '';
  date = '';

  intervalId: any;

  constructor(
    private auth: Auth,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {

    // 🔥 SAFE AUTH (handles refresh properly)
    onAuthStateChanged(this.auth, async (user) => {

      if (user?.email) {
        const dbUser = await this.userService.getUserByEmail(user.email);

        this.userName = dbUser?.name || 'User';
        this.role = dbUser?.role || '';
      }

    });

    // ⏱ TIME
    this.updateTime();

    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  updateTime() {
    const now = new Date();
    this.time = now.toLocaleTimeString();
    this.date = now.toDateString();
  }

  async logout() {
    await signOut(this.auth); // ✅ AngularFire logout
    this.router.navigate(['/']);
  }
}