import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import Backend from 'i18next-fs-backend';

await i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: 'locales/{{lng}}/{{ns}}.json',
    },
    detector: {
      order: ['header'],
    },
    fallbackLng: 'en',
    preload: ['en', 'de'],
  });

export default middleware.handle(i18next);
