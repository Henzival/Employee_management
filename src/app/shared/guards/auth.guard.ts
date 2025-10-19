import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  public canActivate(): Observable<boolean> {
    return this.authService.isLoggedIn().pipe(
      untilDestroyed(this),
      take(1),
      map(isLoggedIn => {
        const isValid = this.authService.validateToken();
        
        if (!isLoggedIn || !isValid) {
          this.authService.logout(); 
          this.router.navigate(['/login']);
          return false;
        }
        
        console.log('AuthGuard: Access granted');
        return true;
      })
    );
  }
}