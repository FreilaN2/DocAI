// Centralización de la URL de la API para facilitar el despliegue
// En desarrollo (fuera de Docker) apuntará a localhost:8000
// En producción/Docker, si el frontend y backend están en el mismo host, se puede ajustar aquí

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default API_BASE_URL;
