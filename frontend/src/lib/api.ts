const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('token') || '';
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function login(email: string, password: string) {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function register(email: string, password: string, name?: string) {
  return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
}

export function me() {
  return apiFetch('/api/auth/me');
}

export function getProjects() {
  return apiFetch('/api/projects');
}

export function getProject(id: string) {
  return apiFetch(`/api/projects/${id}`);
}

export function createProject(data: { title: string; description?: string; genre?: string }) {
  return apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(data) });
}

export function updateProject(id: string, data: any) {
  return apiFetch(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteProject(id: string) {
  return apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
}

export function saveScenes(id: string, scenes: any[]) {
  return apiFetch(`/api/projects/${id}/scenes`, { method: 'PUT', body: JSON.stringify({ scenes }) });
}

export function generateScriptBreakdown(projectId: string, scriptText: string) {
  return apiFetch('/api/generation/script-breakdown', { method: 'POST', body: JSON.stringify({ projectId, scriptText }) });
}

export function generateBackground(projectId: string, sceneId: string, prompt: string) {
  return apiFetch('/api/generation/background', { method: 'POST', body: JSON.stringify({ projectId, sceneId, prompt }) });
}

export function generateVoice(projectId: string, sceneId: string, text: string, voiceStyle?: string) {
  return apiFetch('/api/generation/voice', { method: 'POST', body: JSON.stringify({ projectId, sceneId, text, voiceStyle }) });
}

export function renderVideo(projectId: string) {
  return apiFetch('/api/generation/render', { method: 'POST', body: JSON.stringify({ projectId }) });
}

export function generateCharacter(projectId: string, name: string, bodyTemplateId: string, prompt?: string) {
  return apiFetch(`/api/projects/${projectId}/characters`, { method: 'POST', body: JSON.stringify({ name, bodyTemplateId, prompt }) });
}

export function createCharacterManual(projectId: string, name: string, bodyTemplateId: string, faceImageUrl?: string) {
  return apiFetch(`/api/projects/${projectId}/characters-manual`, { method: 'POST', body: JSON.stringify({ name, bodyTemplateId, faceImageUrl }) });
}

export function updateCharacter(projectId: string, charId: string, data: { customColors?: Record<string, string> }) {
  return apiFetch(`/api/projects/${projectId}/characters/${charId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteCharacter(projectId: string, charId: string) {
  return apiFetch(`/api/projects/${projectId}/characters/${charId}`, { method: 'DELETE' });
}

export function uploadImage(base64: string, folder?: string) {
  return apiFetch('/api/upload/image', { method: 'POST', body: JSON.stringify({ base64, folder }) });
}

export function getCustomMotions() {
  return apiFetch('/api/custom-motions');
}

export function createCustomMotion(data: { name: string; boneKeyframes: Record<string, { frame: number; rotation: number }[]>; durationSec: number; fps: number; loop: boolean }) {
  return apiFetch('/api/custom-motions', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteCustomMotion(id: string) {
  return apiFetch(`/api/custom-motions/${id}`, { method: 'DELETE' });
}
