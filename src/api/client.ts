import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
export const TOKEN_KEY = 'bd_bms_token';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    // Expired / invalid session: drop the token and send the user back to the login page.
    const isLoginCall = String(err?.config?.url || '').includes('/auth/login');
    if (err?.response?.status === 401 && !isLoginCall && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login?expired=1');
    }
    return Promise.reject(err?.response?.data || err);
  }
);

export default api;
