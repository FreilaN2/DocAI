import axios from 'axios';

// Constantes
const TOKEN_KEY = 'token';
const DEV_BASE_URL = 'http://127.0.0.1:8000';
const TIMEOUT = 30000; // 30 segundos de timeout

// Determinar si es producción una sola vez
const IS_PRODUCTION = import.meta.env.PROD;

// Crear instancia de axios con configuración optimizada
const api = axios.create({
  baseURL: IS_PRODUCTION ? '' : DEV_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función helper para obtener el token (con manejo de errores)
const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.warn('No se pudo acceder a localStorage');
    return null;
  }
};

// Interceptor de peticiones - Agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // Asegurar que headers existe
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas - Manejo global de errores
api.interceptors.response.use(
  (response) => {
    // Se puede agregar lógica común para respuestas exitosas
    return response;
  },
  (error) => {
    // Manejo global de errores
    if (error.response) {
      const { status, data } = error.response;
      
      // Error de autenticación
      if (status === 401) {
        // Limpiar datos de sesión si el token expiró
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('user');
        } catch (e) {
          // Error al limpiar localStorage
        }
        
        // Redirigir al login solo si no estamos ya en login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Error de permisos (plan insuficiente)
      if (status === 402) {
        console.warn('Pago requerido:', data.detail);
      }
      
      // Error de límite de tasa
      if (status === 429) {
        console.warn('Demasiadas peticiones. Espera un momento.');
      }
      
      // Error del servidor
      if (status >= 500) {
        console.error('Error del servidor:', data.detail || 'Error interno');
      }
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      console.error('Error de conexión: No se pudo contactar al servidor');
    } else {
      // Error al configurar la petición
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Función helper para peticiones con reintento
api.retryRequest = async (config, maxRetries = 2, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await api(config);
      return response;
    } catch (error) {
      lastError = error;
      
      // Solo reintentar en errores de red o timeout
      const shouldRetry = 
        !error.response || 
        error.response.status >= 500 ||
        error.code === 'ECONNABORTED';
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      // Esperar antes de reintentar (con backoff exponencial)
      const backoffDelay = delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
};

// Función helper para subida de archivos con progreso
api.uploadFile = async (url, formData, onProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentage = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentage);
      }
    },
  });
};

export default api;