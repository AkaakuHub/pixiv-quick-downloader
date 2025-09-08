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

    // Handle English variants (en-US, en-GB, etc.)
    if (lang.startsWith("en-")) {
      return "en";
    }

    // Handle Chinese variants
    if (lang.startsWith("zh-")) {
      if (lang.includes("cn") || lang.includes("sg")) {
        return "zh-CN";
      } else if (lang.includes("tw")) {
        return "zh-TW";
      } else if (lang.includes("hk")) {
        return "zh-HK";
      }
      return "zh";
    }

    const supportedLanguages = ["en", "ja", "zh", "zh-CN", "zh-TW", "zh-HK", "ko"];

    if (supportedLanguages.includes(lang) || supportedLanguages.includes(browserLang)) {
      return supportedLanguages.find(supported => supported.toLowerCase() === lang) || browserLang;
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
