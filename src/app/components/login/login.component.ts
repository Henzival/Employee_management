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
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      password: new FormControl('', [Validators.required, Validators.minLength(4)])
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
    // Автоматический вход, если есть валидная сессия
    if (this.authService.autoLogin()) {
      this.router.navigate(['/admin']);
      return;
    }

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

      // Используем синхронный метод вместо Observable
      const result = this.authService.login(username, password);
      
      if (result.success) {
        this.isLoading = false;
        console.log('Login successful, navigating to admin');
        this.router.navigate(['/admin']);
      } else {
        this.isLoading = false;
        this.errorMessage = result.error || this.translationService.translate('LOGIN.ERROR');
        console.error('Login error:', result.error);
        this.loginForm.patchValue({ password: '' });
        
        // Фокусируемся на поле с ошибкой
        setTimeout(() => {
          if (this.username?.invalid) {
            document.getElementById('username')?.focus();
          } else {
            document.getElementById('password')?.focus();
          }
        }, 100);
      }
    } else {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Пожалуйста, заполните все поля корректно';
      
      // Фокусируемся на первом невалидном поле
      setTimeout(() => {
        if (this.username?.invalid) {
          document.getElementById('username')?.focus();
        } else if (this.password?.invalid) {
          document.getElementById('password')?.focus();
        }
      }, 100);
    }
  }

  public cancel(): void {
    this.router.navigate(['/employees']);
  }

  public clearForm(): void {
    this.loginForm.reset();
    this.errorMessage = '';
    
    // Фокусируемся на поле username после очистки
    setTimeout(() => {
      document.getElementById('username')?.focus();
    }, 100);
  }

  // Демо вход для тестирования
  public demoLogin(): void {
    this.loginForm.patchValue({
      username: 'admin',
      password: 'password'
    });
    
    // Автоматически отправляем форму через короткую задержку
    setTimeout(() => {
      this.login();
    }, 300);
  }

  // Показать/скрыть пароль
  public togglePasswordVisibility(): void {
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
  }

  // Обработка нажатия Enter
  public onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.loginForm.valid) {
      this.login();
    }
  }
}