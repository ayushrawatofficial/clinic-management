import { Component, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector   : 'app-sidebar',
  standalone : true,
  imports    : [],   // @if / @for are built-in in Angular 17+
  templateUrl: './sidebar.html',
  styleUrls  : ['./sidebar.scss']
})
export class SidebarComponent {

  @Input() collapsed = false;

  menu = [
    { name: 'Dashboard', icon: '🏠', route: '/dashboard' },
    { name: 'Patients',  icon: '🧑', route: '/patients'  },
    { name: 'Services',  icon: '🧾', route: '/services'  },
    { name: 'Products',  icon: '💊', route: '/products'  },
    { name: 'Revenue',   icon: '📈', route: '/revenue'   },
  ];

  constructor(private router: Router) {
    this.checkScreen();
  }

  @HostListener('window:resize')
  onResize() { this.checkScreen(); }

  checkScreen() {
    this.collapsed = window.innerWidth < 768;
  }

  toggle() {
    this.collapsed = !this.collapsed;
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(`${route}/`);
  }
}