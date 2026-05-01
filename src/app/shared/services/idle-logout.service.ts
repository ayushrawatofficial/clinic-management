import { Injectable, NgZone } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { merge, fromEvent, Subscription, timer } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { ToastService } from './toast';

@Injectable({ providedIn: 'root' })
export class IdleLogoutService {
  // Default: 30 minutes
  private readonly idleMs = 30 * 60 * 1000;

  private sub: Subscription | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private toast: ToastService,
    private zone: NgZone
  ) {}

  start(): void {
    if (this.sub) return;

    // Run most of it outside Angular to reduce change detection noise.
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll'),
        fromEvent(window, 'focus')
      );

      const s = new Subscription();

      // Only arm the idle timer when logged in.
      const authUnsub = onAuthStateChanged(this.auth, (user) => {
        // Reset any previous activity subscription
        s.unsubscribe();
        const next = new Subscription();

        if (!user) {
          this.sub = next;
          return;
        }

        // Start idle countdown, reset on any activity.
        next.add(
          activity$
            .pipe(
              startWith(null),
              switchMap(() => timer(this.idleMs))
            )
            .subscribe(() => {
              // Back inside Angular for navigation + toast.
              this.zone.run(async () => {
                try {
                  await signOut(this.auth);
                } finally {
                  this.toast.show('Logged out due to inactivity', 'warning');
                  this.router.navigate(['/']);
                }
              });
            })
        );

        this.sub = next;
      });

      // Ensure onAuthStateChanged cleanup if service stopped.
      s.add({ unsubscribe: authUnsub });

      // Store subscription so stop() works.
      this.sub = s;
    });
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }
}

