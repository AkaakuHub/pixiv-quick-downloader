import { translations, Translations } from "./translations";

export class I18n {
  private static instance: I18n;
  private currentLanguage: string;
  private translations: Translations;

  private constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = translations;
  }

  public static getInstance(): I18n {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  private detectLanguage(): string {
    const browserLang = navigator?.language || "en";
    return this.mapLanguageCode(browserLang);
  }

  private mapLanguageCode(browserLang: string): string {
    const lang = browserLang.toLowerCase();

    // Direct mapping for supported languages
    const supportedLanguages = ["en", "ja", "zh", "zh-cn", "zh-tw", "ko"];

    if (supportedLanguages.includes(lang)) {
      return lang;
    }

    // Handle zh-CN and zh-TW specifically
    if (lang.startsWith("zh-")) {
      if (lang.includes("cn") || lang.includes("sg")) {
        return "zh-cn";
      } else if (lang.includes("tw") || lang.includes("hk")) {
        return "zh-tw";
      }
      return "zh";
    }

    // Fallback to English
    return "en";
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public t(key: string, params?: Record<string, string>): string {
    let text = this.translations[key]?.[this.currentLanguage] || this.translations[key]?.en || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), value);
      });
    }

    return text;
  }

  public setLanguage(language: string): void {
    this.currentLanguage = this.mapLanguageCode(language);
  }
}
