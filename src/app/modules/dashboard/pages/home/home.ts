import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Auth } from '@angular/fire/auth';
import { UserService } from '../../../../core/services/user';
import { ServiceService } from '../../../../core/services/service';

import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {

  // modules: any[] = [];
  modules = [
        { name: 'Patients', route: '/patients', icon: '🧑', count: 0 },

        { name: 'Services', route: '/services', icon: '🧾', count: 0 },

        { name: 'Products', route: '/products', icon: '💊', count: 0 },

        // { name: 'Expenses', route: '/expenses', icon: '💰', adminOnly: true, count: 0 },

        // { name: 'Users', route: '/admin', icon: '👥', adminOnly: true, count: 0}
      ];

  constructor(
    private router: Router,
    private auth: Auth,
    private userService: UserService,
    private serviceService: ServiceService
  ) {}

  async ngOnInit() {

    const user = this.auth.currentUser;

    if (!user) return;

    const dbUser = await this.userService.getUserByEmail(user.email!);

    this.loadModules(dbUser?.role || '');
  }

  loadModules(role: string) {

    combineLatest([
      this.serviceService.getServices(),
      this.userService.getUsers()
    ]).subscribe(([services, users]) => {

      const allModules = [
        { name: 'Patients', route: '/patients', icon: '🧑', count: 0 },

        { name: 'Services', route: '/services', icon: '🧾', count: services.length },

        { name: 'Products', route: '/products', icon: '💊', count: 0 },

        // { name: 'Expenses', route: '/expenses', icon: '💰', adminOnly: true, count: 0 },

        // { name: 'Users', route: '/admin', icon: '👥', adminOnly: true, count: users.length }
      ];

      // 🔥 ROLE FILTER
      // this.modules = allModules.filter(m => {
      //   if (m.adminOnly && role !== 'admin') return false;
      //   return true;
      // });

    });
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}