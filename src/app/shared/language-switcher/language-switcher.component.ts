import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  currentLang: string = 'ru';
  translationsLoaded = false;

  private translationsSubscription?: Subscription;

  constructor(
    private translationService: TranslationService, 
    private cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.currentLang = this.translationService.getCurrentLang();
    
    this.translationsSubscription = this.translationService.getTranslationsLoadedObservable()
      .subscribe(loaded => {
        this.translationsLoaded = loaded;
        if (loaded) {
          console.log('Translations loaded in language switcher');
        }
        this.cdRef.detectChanges();
      });
  }

  public ngOnDestroy(): void {
    if (this.translationsSubscription) {
      this.translationsSubscription.unsubscribe();
    }
  }

  public switchLanguage(lang: string): void {
    if (this.translationsLoaded) {
      this.translationService.setLanguage(lang);
      this.currentLang = lang;
      this.cdRef.detectChanges();
    }
  }
}