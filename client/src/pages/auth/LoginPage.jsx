import { Link, useLocation, useNavigate } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import Form from '../../components/ui/Form.jsx';
import Input from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/States.jsx';
import useAuth from '../../hooks/useAuth.js';
import useForm from '../../hooks/useForm.js';
import { PATHS } from '../../routes/paths.js';
import { authApi } from '../../services/authApi.js';
import { required } from '../../utils/validation.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({ loginId: '', password: '' });

  const onSubmit = form.submit(
    { loginId: required('Login ID'), password: required('Password') },
    async (values) => {
      const { token, user } = await authApi.login(values);
      login(token, user);
      navigate(location.state?.from?.pathname ?? PATHS.DASHBOARD, { replace: true });
    }
  );

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold text-text-strong">Sign in</h1>
      <p className="mb-5 text-sm text-muted">Welcome back to StockSense.</p>
      <Form onSubmit={onSubmit}>
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input
          label="Login ID"
          autoComplete="username"
          value={form.values.loginId}
          onChange={form.setField('loginId')}
          error={form.errors.loginId}
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.values.password}
          onChange={form.setField('password')}
          error={form.errors.password}
        />
        <Button type="submit" className="w-full" loading={form.submitting}>
          SIGN IN
        </Button>
      </Form>
      <p className="mt-5 text-center text-sm text-muted">
        <Link to={PATHS.FORGOT_PASSWORD} className="text-accent hover:underline">
          Forgot password?
        </Link>
        <span className="px-2">|</span>
        <Link to={PATHS.SIGNUP} className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
