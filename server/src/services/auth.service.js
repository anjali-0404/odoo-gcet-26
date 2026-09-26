import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendOtpEmail } from './mail.service.js';

const MAX_OTP_ATTEMPTS = 5;
const INVALID_LOGIN = 'Invalid Login Id or Password';
const INVALID_OTP = 'Invalid or expired OTP';

function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

const session = (user) => ({ token: signToken(user), user: user.toJSON() });

async function assertAvailable({ loginId, email }, exceptId) {
  const notMe = exceptId ? { _id: { $ne: exceptId } } : {};
  if (loginId && (await User.exists({ loginId, ...notMe }))) {
    throw ApiError.conflict('Login ID is already taken');
  }
  if (email && (await User.exists({ email, ...notMe }))) {
    throw ApiError.conflict('Email is already registered');
  }
}

export async function signup({ name, loginId, email, password }) {
  await assertAvailable({ loginId, email });
  const user = await User.create({ name: name ?? '', loginId, email, password });
  return session(user);
}

/** `loginId` may also be the account email. */
export async function login({ loginId, password }) {
  const user = await User.findOne({ $or: [{ loginId }, { email: loginId }] }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized(INVALID_LOGIN);
  return session(user);
}

export async function forgotPassword({ email }) {
  const result = { message: 'If an account exists for this email, an OTP has been sent.' };
  const user = await User.findOne({ email });
  if (!user) return result;

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  user.resetOtp = {
    hash: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + env.otpTtlMinutes * 60 * 1000),
    attempts: 0,
  };
  await user.save();
  await sendOtpEmail(user.email, otp);

  if (env.otpDevResponse && !env.isProduction) result.devOtp = otp;
  return result;
}

/** Checks the OTP; counts failed attempts. Returns the user (with password selected). */
async function checkOtp(email, otp) {
  const user = await User.findOne({ email }).select('+resetOtp +password');
  const stored = user?.resetOtp;
  if (!stored?.hash || stored.expiresAt < new Date()) throw ApiError.badRequest(INVALID_OTP);
  if (stored.attempts >= MAX_OTP_ATTEMPTS) {
    throw ApiError.badRequest('Too many attempts. Request a new OTP.');
  }
  if (!(await bcrypt.compare(otp, stored.hash))) {
    user.resetOtp.attempts = stored.attempts + 1;
    await user.save();
    throw ApiError.badRequest(INVALID_OTP);
  }
  return user;
}

export async function verifyOtp({ email, otp }) {
  await checkOtp(email, otp);
  return { valid: true };
}

export async function resetPassword({ email, otp, password }) {
  const user = await checkOtp(email, otp);
  user.password = password;
  user.resetOtp = undefined;
  await user.save();
  return { message: 'Password has been reset. You can now log in.' };
}

export async function updateProfile(user, data) {
  await assertAvailable({ email: data.email }, user._id);
  user.set(data);
  await user.save();
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  return { message: 'Password updated' };
}
