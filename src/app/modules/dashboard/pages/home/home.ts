import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../../core/services/firebase';
import { UserService } from '../../../../core/services/user';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {

  modules: any[] = [];

  constructor(
    private router: Router,
    private firebase: FirebaseService,
    private userService: UserService
  ) {}

  async ngOnInit() {
     this.modules = [
      { name: 'Patients', route: '/dashboard', icon: '🧑' },
      { name: 'Services', route: '/services', icon: '🧾' },
      { name: 'Products', route: '/products', icon: '💊' },
      { name: 'Expenses', route: '/expenses', icon: '💰', adminOnly: true },
      { name: 'Users', route: '/admin', icon: '👥', adminOnly: true }
    ];

 
    const user = this.firebase.auth.currentUser;

    if (!user) return;

    const dbUser = await this.userService.getUserByEmail(user.email!);

    this.setModules(dbUser?.role || '');
  }

  setModules(role: string) {

    const allModules = [
      { name: 'Patients', route: '/dashboard', icon: '🧑' },
      { name: 'Services', route: '/services', icon: '🧾' },
      { name: 'Products', route: '/products', icon: '💊' },
      { name: 'Expenses', route: '/expenses', icon: '💰', adminOnly: true },
      { name: 'Users', route: '/admin', icon: '👥', adminOnly: true }
    ];

    this.modules = allModules;
    // allModules.filter(m => {
    //   if (m.adminOnly && role !== 'admin') return false;
    //   return true;
    // });
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}