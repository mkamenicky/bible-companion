import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import {en, es, fr, de} from '@/localization';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

class LocalizationService {
  private currentLanguage: SupportedLanguage = 'en';
  private listeners: ((language: SupportedLanguage) => void)[] = [];
  private storageKey = 'user_language_preference';
  private initialized = false;

  // Available languages with their display names and flags
  public readonly availableLanguages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ];

  constructor() {
    // Initialize i18next
    i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v4',
        resources: {
          en: { translation: en },
          es: { translation: es },
          fr: { translation: fr },
          de: { translation: de },
          // ja: { translation: ja },
          // zh: { translation: zh },
        },
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false, // React already does escaping
        },
        react: {
          useSuspense: false, // Important for React Native
        },
      });
  }

  /**
   * Initialize the localization service
   * Loads saved language preference or uses device locale
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to load saved language preference
      const savedLanguage = await AsyncStorage.getItem(this.storageKey);

      if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.currentLanguage = savedLanguage as SupportedLanguage;
      } else {
        // Use device locale as fallback
        const locales = getLocales();
        const primaryLocale = locales[0];
        const deviceLanguageCode = primaryLocale.languageCode?.toLowerCase();

        if (deviceLanguageCode && this.isValidLanguage(deviceLanguageCode)) {
          this.currentLanguage = deviceLanguageCode as SupportedLanguage;
        } else {
          this.currentLanguage = 'en'; // Ultimate fallback
        }
      }

      await i18n.changeLanguage(this.currentLanguage);
      this.initialized = true;
      console.debug(`🌐 Localization initialized with language: ${this.currentLanguage}`);
    } catch (error) {
      console.error('❌ Error initializing localization:', error);
      this.currentLanguage = 'en';
      await i18n.changeLanguage('en');
      this.initialized = true;
    }
  }

  /**
   * Change the current language
   */
  async setLanguage(languageCode: SupportedLanguage): Promise<void> {
    if (!this.isValidLanguage(languageCode)) {
      console.warn(`⚠️ Invalid language code: ${languageCode}`);
      return;
    }

    try {
      this.currentLanguage = languageCode;
      await i18n.changeLanguage(languageCode);

      // Save to AsyncStorage
      await AsyncStorage.setItem(this.storageKey, languageCode);

      // Notify listeners
      this.notifyLanguageChange(languageCode);

      console.debug(`🌐 Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('❌ Error saving language preference:', error);
    }
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get current language display info
   */
  getCurrentLanguageInfo(): LanguageOption {
    return this.availableLanguages.find(lang => lang.code === this.currentLanguage) || this.availableLanguages[0];
  }

  /**
   * Check if RTL (Right-to-Left) should be used for current language
   */
  isRTL(): boolean {
    // Add RTL languages here when supported
    const rtlLanguages: SupportedLanguage[] = []; // e.g., ['ar', 'he']
    return rtlLanguages.includes(this.currentLanguage);
  }

  /**
   * Translate a key with optional interpolation
   */
  t(key: string, options?: Record<string, any>): string {
    try {
      return i18n.t(key, options);
    } catch (error) {
      console.warn(`⚠️ Translation missing for key: ${key}`);
      return key; // Return the key itself as fallback
    }
  }

  /**
   * Get the i18next instance (for use with react-i18next hooks)
   */
  getI18nInstance() {
    return i18n;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get device's locale information
   */
  getDeviceLocaleInfo() {
    const locales = getLocales();
    const primaryLocale = locales[0];

    return {
      locales,
      primaryLocale,
      languageCode: primaryLocale.languageCode,
      languageTag: primaryLocale.languageTag,
      regionCode: primaryLocale.regionCode,
      currencyCode: primaryLocale.currencyCode,
      textDirection: primaryLocale.textDirection,
    };
  }

  /**
   * Format numbers according to current locale
   */
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.getLocaleCode(), options).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  /**
   * Format dates according to current locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.getLocaleCode(), options).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  /**
   * Add a listener for language changes
   */
  addLanguageChangeListener(callback: (language: SupportedLanguage) => void): () => void {
    this.listeners.push(callback);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Private methods
   */
  private isValidLanguage(code: string): boolean {
    return this.availableLanguages.some(lang => lang.code === code);
  }

  private notifyLanguageChange(language: SupportedLanguage): void {
    this.listeners.forEach(callback => {
      try {
        callback(language);
      } catch (error) {
        console.error('❌ Error in language change listener:', error);
      }
    });
  }

  private getLocaleCode(): string {
    // Convert language code to locale code for Intl formatting
    const localeMap: Record<SupportedLanguage, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };

    return localeMap[this.currentLanguage] || 'en-US';
  }
}

// Export singleton instance
export const localizationService = new LocalizationService();
