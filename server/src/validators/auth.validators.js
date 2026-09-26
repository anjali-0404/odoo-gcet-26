import { z } from 'zod';

// Rules from the mockup's sign-up notes.
const loginId = z
  .string()
  .trim()
  .toLowerCase()
  .min(6, 'Login ID must be 6-12 characters')
  .max(12, 'Login ID must be 6-12 characters')
  .regex(/^[a-z0-9._-]+$/, 'Login ID may only contain letters, numbers, dot, underscore and hyphen');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

const password = z
  .string()
  .min(9, 'Password must be more than 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

const otp = z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits');
const name = z.string().trim().max(80);

export const signupSchema = z.object({ name: name.optional(), loginId, email, password });

export const loginSchema = z.object({
  loginId: z.string().trim().toLowerCase().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({ email });
export const verifyOtpSchema = z.object({ email, otp });
export const resetPasswordSchema = z.object({ email, otp, password });

export const updateProfileSchema = z
  .object({ name: name.optional(), email: email.optional() })
  .refine((v) => v.name !== undefined || v.email !== undefined, { message: 'Nothing to update' });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});
