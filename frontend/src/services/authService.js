import api, { ensureCsrfToken, getCsrfToken } from './api';

export async function prepareAuthForms() {
  await ensureCsrfToken();
}

async function postWithFreshCsrf(url, payload, config = {}) {
  await ensureCsrfToken();
  const csrfToken = getCsrfToken();
  const response = await api.post(url, payload, {
    ...config,
    headers: csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {},
  });
  return response.data;
}

async function putWithFreshCsrf(url, payload, config = {}) {
  await ensureCsrfToken();
  const csrfToken = getCsrfToken();
  const response = await api.put(url, payload, {
    ...config,
    headers: csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {},
  });
  return response.data;
}

export async function loginUser(payload) {
  return postWithFreshCsrf('/auth/login', payload, { skipAuthRefresh: true });
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function logoutUser() {
  return postWithFreshCsrf('/auth/logout', {});
}

export async function registerUser(payload) {
  return postWithFreshCsrf('/auth/register', payload, { skipAuthRefresh: true });
}

export async function updateProfile(payload) {
  const response = await api.put('/auth/profile', payload);
  return response.data;
}

export async function changePassword(payload) {
  return putWithFreshCsrf('/auth/password', payload);
}

export async function listUsers() {
  const response = await api.get('/auth/users');
  return response.data;
}

export async function updateUserAccess(userId, payload) {
  const response = await api.patch(`/auth/users/${userId}/access`, payload);
  return response.data;
}

export async function requestEmailVerification(payload) {
  return postWithFreshCsrf('/auth/verify-email/request', payload, { skipAuthRefresh: true });
}

export async function confirmEmailVerification(payload) {
  return postWithFreshCsrf('/auth/verify-email/confirm', payload, { skipAuthRefresh: true });
}

export async function validateEmailVerificationToken(token) {
  const response = await api.get(`/auth/verify-email/validate?token=${token}`);
  return response.data;
}

export async function forgotPassword(payload) {
  return postWithFreshCsrf('/auth/password/forgot', payload, { skipAuthRefresh: true });
}

export async function resetPassword(payload) {
  return postWithFreshCsrf('/auth/password/reset', payload, { skipAuthRefresh: true });
}

export async function validateResetToken(token) {
  const response = await api.get(`/auth/password/reset/validate?token=${token}`);
  return response.data;
}
