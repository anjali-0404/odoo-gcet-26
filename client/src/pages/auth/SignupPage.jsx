import { Link, useNavigate } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import Form from '../../components/ui/Form.jsx';
import Input from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/States.jsx';
import useAuth from '../../hooks/useAuth.js';
import useForm from '../../hooks/useForm.js';
import { PATHS } from '../../routes/paths.js';
import { authApi } from '../../services/authApi.js';
import { validateEmail, validateLoginId, validatePassword } from '../../utils/validation.js';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm({ loginId: '', email: '', password: '', confirmPassword: '' });

  const onSubmit = form.submit(
    {
      loginId: validateLoginId,
      email: validateEmail,
      password: validatePassword,
      confirmPassword: (v, all) => (v !== all.password ? 'Passwords do not match' : null),
    },
    async ({ loginId, email, password }) => {
      const { token, user } = await authApi.signup({ loginId: loginId.trim(), email: email.trim(), password });
      login(token, user);
      navigate(PATHS.DASHBOARD, { replace: true });
    }
  );

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold text-text-strong">Create account</h1>
      <p className="mb-5 text-sm text-muted">Set up your StockSense login.</p>
      <Form onSubmit={onSubmit}>
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input
          label="Login ID"
          hint="6-12 characters, must be unique"
          autoComplete="username"
          value={form.values.loginId}
          onChange={form.setField('loginId')}
          error={form.errors.loginId}
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.values.email}
          onChange={form.setField('email')}
          error={form.errors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="More than 8 characters with upper, lower case and a special character"
          value={form.values.password}
          onChange={form.setField('password')}
          error={form.errors.password}
        />
        <Input
          label="Re-enter password"
          type="password"
          autoComplete="new-password"
          value={form.values.confirmPassword}
          onChange={form.setField('confirmPassword')}
          error={form.errors.confirmPassword}
        />
        <Button type="submit" className="w-full" loading={form.submitting}>
          SIGN UP
        </Button>
      </Form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to={PATHS.LOGIN} className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
