import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Form, { FormActions } from '../../components/ui/Form.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Alert } from '../../components/ui/States.jsx';
import useAuth from '../../hooks/useAuth.js';
import useForm from '../../hooks/useForm.js';
import useToast from '../../hooks/useToast.js';
import { authApi } from '../../services/authApi.js';
import { validateEmail, validatePassword } from '../../utils/validation.js';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const profile = useForm({ name: user?.name ?? '', email: user?.email ?? '' });
  const password = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const saveProfile = profile.submit({ email: validateEmail }, async (values) => {
    const updated = await authApi.updateMe({ name: values.name.trim(), email: values.email.trim() });
    setUser(updated);
    toast.success('Profile updated');
  });

  const savePassword = password.submit(
    {
      currentPassword: (v) => (v ? null : 'Current password is required'),
      newPassword: validatePassword,
      confirmPassword: (v, all) => (v !== all.newPassword ? 'Passwords do not match' : null),
    },
    async ({ currentPassword, newPassword }) => {
      const result = await authApi.changePassword({ currentPassword, newPassword });
      password.setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(result.message);
    }
  );

  return (
    <section>
      <PageHeader title="My Profile" subtitle={user ? `Signed in as ${user.loginId}` : undefined} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profile">
          <Form onSubmit={saveProfile}>
            {profile.formError && <Alert>{profile.formError}</Alert>}
            <Input label="Login ID" value={user?.loginId ?? ''} disabled hint="Login ID cannot be changed" />
            <Input label="Name" value={profile.values.name} onChange={profile.setField('name')} error={profile.errors.name} />
            <Input label="Email" type="email" value={profile.values.email} onChange={profile.setField('email')} error={profile.errors.email} />
            <FormActions>
              <Button type="submit" loading={profile.submitting}>
                Save profile
              </Button>
            </FormActions>
          </Form>
        </Card>
        <Card title="Change password">
          <Form onSubmit={savePassword}>
            {password.formError && <Alert>{password.formError}</Alert>}
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={password.values.currentPassword}
              onChange={password.setField('currentPassword')}
              error={password.errors.currentPassword}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password.values.newPassword}
              onChange={password.setField('newPassword')}
              error={password.errors.newPassword}
            />
            <Input
              label="Re-enter new password"
              type="password"
              autoComplete="new-password"
              value={password.values.confirmPassword}
              onChange={password.setField('confirmPassword')}
              error={password.errors.confirmPassword}
            />
            <FormActions>
              <Button type="submit" loading={password.submitting}>
                Update password
              </Button>
            </FormActions>
          </Form>
        </Card>
      </div>
    </section>
  );
}
