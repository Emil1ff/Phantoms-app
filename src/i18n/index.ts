export type Language = 'en' | 'az' | 'ru';

const en = require('./locales/en.json') as Record<string, string>;
const az = require('./locales/az.json') as Record<string, string>;
const ru = require('./locales/ru.json') as Record<string, string>;

const dictionaries: Record<Language, Record<string, string>> = { en, az, ru };

export function t(language: Language, key: string): string {
  return dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key;
}
