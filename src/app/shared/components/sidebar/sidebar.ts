import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {

   @Input() collapsed: boolean = false;

  menu = [
    { name: 'Dashboard', icon: '🏠', route: '/dashboard' },
    { name: 'Patients', icon: '🧑', route: '/patients' },
    { name: 'Services', icon: '🧾', route: '/services' },
    { name: 'Products', icon: '💊', route: '/products' },
    // { name: 'Expenses', icon: '💰', route: '/expenses' },
    // { name: 'Users', icon: '👥', route: '/admin' }
  ];

  constructor(private router: Router) {
    this.checkScreen();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreen();
  }

  checkScreen() {
    if (window.innerWidth < 768) {
      this.collapsed = true;   // 🔥 auto collapse
    }
  }

  toggle() {
    this.collapsed = !this.collapsed;
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}