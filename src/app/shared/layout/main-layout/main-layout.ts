import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { LoaderComponent } from '../../components/loader/loader';
import { ToastComponent } from '../../components/toast/toast';
import { FooterComponent } from '../../components/footer/footer';
import { IdleLogoutService } from '../../services/idle-logout.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, LoaderComponent,ToastComponent,FooterComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  collapsed = false;

  constructor(private idleLogout: IdleLogoutService) {
    this.idleLogout.start();
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
