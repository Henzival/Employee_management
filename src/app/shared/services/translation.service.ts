import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

interface Translations {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang = new BehaviorSubject<string>('ru');
  private translations: { [key: string]: Translations } = {
    ru: {},
    en: {}
  };
  
  private translationsLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadTranslations('ru');
    this.loadTranslations('en');
  }

  private loadTranslations(lang: string): void {
    this.http.get<Translations>(`${lang}.json`)
      .pipe(
        catchError(error => {
          console.error(`Error loading ${lang} translations:`, error);
          return [{}];
        })
      )
      .subscribe(translations => {
        this.translations[lang] = translations;
        if (this.translations['ru'] && Object.keys(this.translations['ru']).length > 0 &&
            this.translations['en'] && Object.keys(this.translations['en']).length > 0) {
          this.translationsLoaded.next(true);
        }
      });
  }

  public translate(key: string): string {
    const translation = this.translations[this.currentLang.value]?.[key];
    return translation || key;
  }

  public setLanguage(lang: string): void {
    if (this.translations[lang] && Object.keys(this.translations[lang]).length > 0) {
      this.currentLang.next(lang);
    } else {
      console.warn(`Translations for language ${lang} are not loaded yet`);
    }
  }

  public getCurrentLang(): string {
    return this.currentLang.value;
  }

  public getLanguageObservable(): Observable<string> {
    return this.currentLang.asObservable();
  }

  public getTranslationsLoadedObservable(): Observable<boolean> {
    return this.translationsLoaded.asObservable();
  }

  public reloadTranslations(lang: string): Observable<boolean> {
    return this.http.get<Translations>(`${lang}.json`)
      .pipe(
        tap(translations => {
          this.translations[lang] = translations;
        }),
        map(() => true),
        catchError(error => {
          console.error(`Error reloading ${lang} translations:`, error);
          return [false];
        })
      );
  }
}