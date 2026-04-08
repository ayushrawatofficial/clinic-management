import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';


import { Router } from '@angular/router';
import { FirebaseService } from '../../../core/services/firebase';
import { UserService } from '../../../core/services/user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit {

  userName = '';
  role = '';
  time = '';
  date = '';

  constructor(
    private firebase: FirebaseService,
    private userService: UserService,
    private router: Router
  ) {}

  async ngOnInit() {
    const user = this.firebase.auth.currentUser;

    if (user?.email) {
      const dbUser = await this.userService.getUserByEmail(user.email);

      this.userName = dbUser?.name || 'User';
      this.role = dbUser?.role || '';
    }

    this.updateTime();

    setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  updateTime() {
    const now = new Date();
    this.time = now.toLocaleTimeString();
    this.date = now.toDateString();
  }

  logout() {
    this.firebase.auth.signOut();
    this.router.navigate(['/']);
  }
}