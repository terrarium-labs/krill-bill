// Language codes from languages.ts
export type LanguageCode = 'ca' | 'es' | 'en' | 'fr' | 'pt' | 'it' | 'de' | 'ar' | 'zh' | 'ru' | 'ja';

// Currency codes from currencies.ts
export type CurrencyCode = 'EUR' | 'USD' | 'JPY' | 'GBP' | 'CNY' | 'CAD' | 'AUD' | 'CHF' | 'HKD' | 'SGD';

export interface TaxType {
    group_name: string;
    id: string
    type: string
    amount: number
    is_negative: boolean
    country: string
}

export type IntegrationType = "google_mail" | "google_calendar" | "outlook";

export interface Integration {
  id: IntegrationType;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

export type IconType = string | React.ComponentType<{ className?: string }>;