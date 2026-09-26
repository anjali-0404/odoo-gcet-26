import api, { unwrap } from './api.js';

/** docs/API.md §4 */
export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload).then(unwrap),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload).then(unwrap),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  updateMe: (payload) => api.patch('/auth/me', payload).then(unwrap),
  changePassword: (payload) => api.patch('/auth/me/password', payload).then(unwrap),
};
