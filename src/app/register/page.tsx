import { AuthForm } from '@/components/auth-form';
import { redirect } from 'next/navigation';
import { pageSession } from '@/lib/page-session';
export default async function Page() {
  if (await pageSession()) redirect('/app');
  return <AuthForm register />;
}
