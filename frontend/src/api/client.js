import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 5000
});

export const tokenKey = 'pet-health-passport-token';

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && sessionStorage.getItem(tokenKey)) {
    sessionStorage.removeItem(tokenKey);
    window.dispatchEvent(new Event('pet-session-expired'));
  }
  return Promise.reject(error);
});
