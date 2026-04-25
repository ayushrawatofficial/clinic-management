import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { ConfigService } from '../../../core/config/clinic.service';
import { UserService } from '../../../core/services/user';
import { CommonModule } from '@angular/common';

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

  @Output() toggle = new EventEmitter();
  @Input() collapsed = false;

  intervalId: any;

  constructor(
    private auth: Auth,
    private userService: UserService,
    private router: Router,
    public config: ConfigService,
    private cdr: ChangeDetectorRef   // 🔥 IMPORTANT
  ) {}

  ngOnInit() {

    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        const dbUser = await this.userService.getUserByEmail(user.email);
        this.userName = dbUser?.name || 'User';
        this.role = dbUser?.role || '';
        this.cdr.detectChanges(); // 🔥 ensure UI update
      }
    });

    this.updateTime();

    this.intervalId = setInterval(() => {
      this.updateTime();

      // 🔥 FORCE UI UPDATE
      this.cdr.detectChanges();

    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  updateTime() {
    const now = new Date();

    this.time = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    this.date = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }
}