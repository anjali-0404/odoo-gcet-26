import { Link, useLocation, useNavigate } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import Form from '../../components/ui/Form.jsx';
import Input from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/States.jsx';
import useForm from '../../hooks/useForm.js';
import useToast from '../../hooks/useToast.js';
import { PATHS } from '../../routes/paths.js';
import { authApi } from '../../services/authApi.js';
import { validateEmail, validatePassword } from '../../utils/validation.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { state } = useLocation();
  const form = useForm({ email: state?.email ?? '', otp: '', password: '', confirmPassword: '' });

  const onSubmit = form.submit(
    {
      email: validateEmail,
      otp: (v) => (/^\d{6}$/.test(v.trim()) ? null : 'OTP must be 6 digits'),
      password: validatePassword,
      confirmPassword: (v, all) => (v !== all.password ? 'Passwords do not match' : null),
    },
    async ({ email, otp, password }) => {
      const result = await authApi.resetPassword({ email: email.trim(), otp: otp.trim(), password });
      toast.success(result.message);
      navigate(PATHS.LOGIN, { replace: true });
    }
  );

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold text-text-strong">Reset password</h1>
      <p className="mb-5 text-sm text-muted">Enter the OTP from your email and choose a new password.</p>
      {state?.devOtp && (
        <Alert tone="info" className="mb-4">
          Demo mode: your OTP is <strong>{state.devOtp}</strong>
        </Alert>
      )}
      <Form onSubmit={onSubmit}>
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input label="Email" type="email" value={form.values.email} onChange={form.setField('email')} error={form.errors.email} />
        <Input
          label="OTP"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          value={form.values.otp}
          onChange={form.setField('otp')}
          error={form.errors.otp}
          autoFocus
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={form.values.password}
          onChange={form.setField('password')}
          error={form.errors.password}
        />
        <Input
          label="Re-enter new password"
          type="password"
          autoComplete="new-password"
          value={form.values.confirmPassword}
          onChange={form.setField('confirmPassword')}
          error={form.errors.confirmPassword}
        />
        <Button type="submit" className="w-full" loading={form.submitting}>
          Reset password
        </Button>
      </Form>
      <p className="mt-5 text-center text-sm">
        <Link to={PATHS.FORGOT_PASSWORD} className="text-accent hover:underline">
          Send a new code
        </Link>
      </p>
    </>
  );
}
