import { LoginForm } from './login-form';
import { LoginHeading, LoginShell } from './login-shell';

export function LoginPage() {
  return (
    <LoginShell>
      <LoginHeading />
      <LoginForm />
    </LoginShell>
  );
}
