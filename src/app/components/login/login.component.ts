import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { TranslationService } from '../../shared/services/translation.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  translationsLoaded = false;

  private translationsSubscription: Subscription;

  constructor(
    private authService: AuthService, 
    private router: Router,
    public translationService: TranslationService
  ) {
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });

    this.translationsSubscription = this.translationService.getTranslationsLoadedObservable()
      .subscribe(loaded => {
        this.translationsLoaded = loaded;
        if (loaded) {
          console.log('Translations loaded in login component');
        }
      });
  }

  public ngOnInit(): void {
    setTimeout(() => {
      const usernameField = document.getElementById('username');
      if (usernameField) {
        usernameField.focus();
      }
    }, 100);
  }

  public ngOnDestroy(): void {
    if (this.translationsSubscription) {
      this.translationsSubscription.unsubscribe();
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  public login(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.translationService.translate('LOGIN.ERROR');
          console.error('Login error:', error);
          this.loginForm.patchValue({ password: '' });
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  public cancel(): void {
    this.router.navigate(['/employees']);
  }

  public clearForm(): void {
    this.loginForm.reset();
    this.errorMessage = '';
  }
}