import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import hu from '../locales/hu.json';

const RESOURCES = {
    en: { translation: en },
    hu: { translation: hu },
};

const LANGUAGE_DETECTOR = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            const storedLanguage = await AsyncStorage.getItem('user-language');
            if (storedLanguage) {
                return callback(storedLanguage);
            }
        } catch (error) {
            console.log('Error reading language from storage', error);
        }

        // Fallback to device language
        const deviceLang = Localization.getLocales()[0].languageCode;
        // Check if device language is supported, otherwise fallback to 'en'
        const supportedLangs = Object.keys(RESOURCES);
        const bestLang = supportedLangs.includes(deviceLang || 'en') ? deviceLang : 'en';

        callback(bestLang || 'en');
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('user-language', language);
        } catch (error) {
            console.log('Error saving language to storage', error);
        }
    },
};

i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
        resources: RESOURCES,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        }
    });

export default i18n;
