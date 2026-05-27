import axios from 'axios';

// Vite detecta automáticamente si hiciste 'npm run build' (PROD = true)
const IS_PRODUCTION = import.meta.env.PROD;

const api = axios.create({
  // URL directa y segura, sin depender de archivos .env externos
  baseURL: IS_PRODUCTION 
    ? 'https://docai.teleredtv.com' 
    : 'http://127.0.0.1:8000',
});

// Interceptor para incluir el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Blindaje para evitar el error 401 en LiteSpeed/cPanel
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;