import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

export async function signup(req, res) {
  sendSuccess(res, await authService.signup(req.valid.body), 201);
}

export async function login(req, res) {
  sendSuccess(res, await authService.login(req.valid.body));
}

export async function forgotPassword(req, res) {
  sendSuccess(res, await authService.forgotPassword(req.valid.body));
}

export async function verifyOtp(req, res) {
  sendSuccess(res, await authService.verifyOtp(req.valid.body));
}

export async function resetPassword(req, res) {
  sendSuccess(res, await authService.resetPassword(req.valid.body));
}

export function me(req, res) {
  sendSuccess(res, req.user);
}

export async function updateMe(req, res) {
  sendSuccess(res, await authService.updateProfile(req.user, req.valid.body));
}

export async function changePassword(req, res) {
  sendSuccess(res, await authService.changePassword(req.user._id, req.valid.body));
}
