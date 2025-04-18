import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'dashboard.welcome': 'Welcome to T2M Dashboard',
      'dashboard.telegram.loading': 'Loading...',
      'dashboard.telegram.dialogsCount': 'You have access to {{count}} Telegram dialogs',
      'dashboard.telegram.connected': 'Connected with API ID: {{apiId}}',
      'settings.title': 'Settings',
      'settings.description': 'Manage your application settings here.',
      'metatrader.title': 'Metatrader 5 Sync',
      'metatrader.description': 'Configure your Metatrader 5 integration settings here.',
      'common.dashboard': 'Dashboard',
      'common.create': 'Create',
      'common.logout': 'Logout',
      'app.name': 'Telegram to MT5',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false
    }
  });

export default i18n; 