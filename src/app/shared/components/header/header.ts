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

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],  // no CommonModule needed — no *ngIf/*ngFor in template
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  userName = '';
  role     = '';
  initials = '';
  time     = '';
  date     = '';

  @Output() toggle    = new EventEmitter<void>();
  @Input()  collapsed = false;

  private intervalId: any;

  constructor(
    private auth       : Auth,
    private userService: UserService,
    private router     : Router,
    public  config     : ConfigService,
    private cdr        : ChangeDetectorRef
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        const dbUser   = await this.userService.getUserByEmail(user.email);
        this.userName  = dbUser?.name || user.displayName || 'User';
        this.role      = dbUser?.role || '';
        this.initials  = this.getInitials(this.userName);
        this.cdr.detectChanges();
      }
    });

    this.updateTime();
    this.intervalId = setInterval(() => {
      this.updateTime();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  private updateTime() {
    const now  = new Date();
    this.time  = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.date  = now.toLocaleDateString('en-IN',  { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** "Vinod Sharma" → "VS" */
  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }
}