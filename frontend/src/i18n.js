import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Constantes
const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';
const DETECTION_OPTIONS = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
  cookieMinutes: 525600, // 1 año
};

// Caché de traducciones cargadas
const loadedResources = {};

// Función para cargar traducciones bajo demanda
const loadResource = async (language) => {
  // Si ya está en caché, retornar inmediatamente
  if (loadedResources[language]) {
    return loadedResources[language];
  }

  try {
    // Carga dinámica del archivo de traducción
    const module = await import(`./locales/${language}.json`);
    loadedResources[language] = module.default;
    return module.default;
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    // Fallback al idioma por defecto
    if (language !== DEFAULT_LANGUAGE) {
      return loadResource(DEFAULT_LANGUAGE);
    }
    return {};
  }
};

// Plugin de backend personalizado para carga perezosa
const lazyLoadBackend = {
  type: 'backend',
  init: () => {},
  read: async (language, namespace, callback) => {
    try {
      const resource = await loadResource(language);
      callback(null, resource);
    } catch (error) {
      callback(error, null);
    }
  },
};

// Configuración de i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Carga inicial con idiomas pre-cargados (los más comunes)
    resources: {
      es: { translation: {} }, // Se llenará con lazy load
      en: { translation: {} }, // Se llenará con lazy load
    },
    
    // Configuración de idioma
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    
    // Detección de idioma
    detection: DETECTION_OPTIONS,
    
    // Interpolación
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
      format: (value, format) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
        return value;
      },
    },
    
    // Opciones de carga
    load: 'languageOnly', // Cargar solo el idioma sin región (ej: 'es' en lugar de 'es-ES')
    preload: SUPPORTED_LANGUAGES,
    
    // React
    react: {
      useSuspense: false, // No usar Suspense para evitar problemas con SSR
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span'],
    },
    
    // Debug solo en desarrollo
    debug: import.meta.env.DEV,
    
    // Retornar objetos completos
    returnObjects: false,
    
    // Key separator
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
    
    // Plural rules
    pluralSeparator: '_',
    contextSeparator: '_',
  });

// Cargar los recursos iniciales
Promise.all(
  SUPPORTED_LANGUAGES.map(lang => loadResource(lang))
).then(() => {
  // Forzar actualización después de cargar
  i18n.emit('loaded');
  i18n.emit('languageChanged', i18n.language);
}).catch(error => {
  console.error('Error loading initial translations:', error);
});

// Función helper para cambiar idioma con callback
export const changeLanguage = async (language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    console.warn(`Language ${language} is not supported. Falling back to ${DEFAULT_LANGUAGE}`);
    language = DEFAULT_LANGUAGE;
  }

  try {
    // Asegurar que los recursos estén cargados
    const resources = await loadResource(language);
    
    // Agregar recursos al store de i18next
    i18n.addResourceBundle(language, 'translation', resources, true, true);
    
    // Cambiar idioma
    await i18n.changeLanguage(language);
    
    return true;
  } catch (error) {
    console.error(`Error changing language to ${language}:`, error);
    return false;
  }
};

// Función helper para obtener el idioma actual
export const getCurrentLanguage = () => {
  return i18n.language || DEFAULT_LANGUAGE;
};

// Función helper para verificar si un idioma está soportado
export const isLanguageSupported = (language) => {
  return SUPPORTED_LANGUAGES.includes(language);
};

// Función helper para obtener la lista de idiomas soportados
export const getSupportedLanguages = () => {
  return SUPPORTED_LANGUAGES.map(code => ({
    code,
    name: i18n.t(`languages.${code}`, { lng: code }) || code.toUpperCase(),
  }));
};

// Exportar configuración para debugging
export const i18nConfig = {
  supportedLanguages: SUPPORTED_LANGUAGES,
  defaultLanguage: DEFAULT_LANGUAGE,
  loadedResources: () => Object.keys(loadedResources),
};

export default i18n;