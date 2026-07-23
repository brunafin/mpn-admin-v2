import axios from 'axios';
import { getAccessToken, logoutAndRedirect } from '../utils/authCookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      const path = window.location.pathname;
      if (path !== '/') {
        logoutAndRedirect();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
