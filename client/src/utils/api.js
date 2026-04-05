import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // AI 응답은 시간이 걸릴 수 있음
  headers: { 'Content-Type': 'application/json' },
});

export async function sendChat(messages) {
  const response = await api.post('/chat', { messages });
  return response.data;
}

export async function getInstances() {
  const response = await api.get('/infra/instances');
  return response.data;
}

export async function getCost() {
  const response = await api.get('/infra/cost');
  return response.data;
}

export async function getDailyCosts(days = 7) {
  const response = await api.get(`/infra/cost/daily?days=${days}`);
  return response.data;
}

export async function killSwitch() {
  const response = await api.post('/infra/kill-switch', { confirm: 'CONFIRM_STOP_ALL' });
  return response.data;
}

export default api;
