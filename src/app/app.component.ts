import { Component, OnInit } from '@angular/core';
import { TranslationService } from './shared/services/translation.service';
import { AuthService } from './shared/services/auth.service';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(
    public translationService: TranslationService,
    private authService: AuthService,
    private router: Router
  ) {}

  public ngOnInit(): void {
    this.authService.isLoggedIn().pipe(untilDestroyed(this)).subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/employees']);
  }
}