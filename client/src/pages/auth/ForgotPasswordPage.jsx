import { Link, useNavigate } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import Form from '../../components/ui/Form.jsx';
import Input from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/States.jsx';
import useForm from '../../hooks/useForm.js';
import { PATHS } from '../../routes/paths.js';
import { authApi } from '../../services/authApi.js';
import { validateEmail } from '../../utils/validation.js';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const form = useForm({ email: '' });

  const onSubmit = form.submit({ email: validateEmail }, async ({ email }) => {
    const result = await authApi.forgotPassword({ email: email.trim() });
    navigate(PATHS.RESET_PASSWORD, { state: { email: email.trim(), devOtp: result.devOtp } });
  });

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold text-text-strong">Forgot password</h1>
      <p className="mb-5 text-sm text-muted">We'll send a 6-digit code to your email.</p>
      <Form onSubmit={onSubmit}>
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.values.email}
          onChange={form.setField('email')}
          error={form.errors.email}
          autoFocus
        />
        <Button type="submit" className="w-full" loading={form.submitting}>
          Send OTP
        </Button>
      </Form>
      <p className="mt-5 text-center text-sm">
        <Link to={PATHS.LOGIN} className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
