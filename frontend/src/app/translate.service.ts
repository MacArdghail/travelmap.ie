import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private translations = signal<any>({});
  private currentLang = signal<string>('en');

  constructor(private http: HttpClient) {
    // Check localStorage for saved language preference before loading
    const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('preferredLanguage') : null;
    const initialLang = (savedLang === 'ga' || savedLang === 'en') ? savedLang : 'en';
    
    // Set language immediately so UI can read it
    this.currentLang.set(initialLang);
    
    // Then load translations
    this.loadTranslations(initialLang);
  }

  loadTranslations(lang: string) {
    // Set language immediately before HTTP call
    this.currentLang.set(lang);
    
    this.http.get(`/i18n/${lang}.json`).subscribe((data) => {
      this.translations.set(data);
    });
  }

  translate(key: string, returnFullObject: boolean = false): any {
    const keys = key.split('.');
    let value = this.translations();
    
    for (const k of keys) {
      value = value?.[k];
      if (!value) return key;
    }
    
    // If caller wants full object, return it
    if (returnFullObject) {
      return value;
    }
    
    // If value is an object with 'name' property, return the name
    if (typeof value === 'object' && value !== null && 'name' in value) {
      return value.name;
    }
    
    return value || key;
  }

  setLanguage(lang: string) {
    this.loadTranslations(lang);
  }

  getCurrentLang(): string {
    return this.currentLang();
  }

  // Observable for language changes
  onLanguageChange(callback: () => void) {
    // Use effect to watch for language changes
    return this.currentLang;
  }
}
