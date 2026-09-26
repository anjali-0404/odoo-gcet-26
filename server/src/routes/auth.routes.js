import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from '../validators/auth.validators.js';

const router = Router();

// Public
router.post('/signup', validate({ body: signupSchema }), auth.signup);
router.post('/login', validate({ body: loginSchema }), auth.login);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), auth.forgotPassword);
router.post('/verify-otp', validate({ body: verifyOtpSchema }), auth.verifyOtp);
router.post('/reset-password', validate({ body: resetPasswordSchema }), auth.resetPassword);

// Protected
router.get('/me', requireAuth, auth.me);
router.patch('/me', requireAuth, validate({ body: updateProfileSchema }), auth.updateMe);
router.patch('/me/password', requireAuth, validate({ body: changePasswordSchema }), auth.changePassword);

export default router;
