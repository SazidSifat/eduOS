import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '../../features/authentication/components/login-form';
export const Route = createFileRoute('/login/')({ component: LoginPage });
