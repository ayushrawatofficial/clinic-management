import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { Loader } from '../../components/loader/loader';
import { ToastComponent } from '../../components/toast/toast';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, Loader,ToastComponent,FooterComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  collapsed = false;

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
