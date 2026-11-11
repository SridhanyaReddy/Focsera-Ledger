import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('focsera_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('focsera_token');
      localStorage.removeItem('focsera_admin');
      if (!window.location.pathname.includes('/setup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

