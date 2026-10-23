import axios from 'axios';
import { thaiError } from '../i18n.js';

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
  if (typeof error.response?.data?.error === 'string') error.response.data.error = thaiError(error.response.data.error);
  if (error.response?.status === 401 && sessionStorage.getItem(tokenKey)) {
    sessionStorage.removeItem(tokenKey);
    window.dispatchEvent(new Event('pet-session-expired'));
  }
  return Promise.reject(error);
});
