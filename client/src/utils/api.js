import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청마다 토큰 자동 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 시 로그아웃 처리
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export async function login(username, password) {
  const res = await api.post('/auth/login', { username, password });
  return res.data;
}

export async function register(username, password) {
  const res = await api.post('/auth/register', { username, password });
  return res.data;
}

export async function loginDemo() {
  const res = await api.post('/auth/demo');
  return res.data;
}

export async function sendChat(messages) {
  const res = await api.post('/chat', { messages });
  return res.data;
}

export async function getInstances() {
  const res = await api.get('/infra/instances');
  return res.data;
}

export async function getCost() {
  const res = await api.get('/infra/cost');
  return res.data;
}

export async function getDailyCosts(days = 7) {
  const res = await api.get(`/infra/cost/daily?days=${days}`);
  return res.data;
}

export async function killSwitch() {
  const res = await api.post('/infra/kill-switch', { confirm: 'CONFIRM_STOP_ALL' });
  return res.data;
}

export async function checkHealth() {
  const res = await api.get('/health');
  return res.data;
}

export async function getSettings() {
  const res = await api.get('/settings');
  return res.data;
}

export async function saveSettings(settings) {
  const res = await api.post('/settings', settings);
  return res.data;
}

export default api;
