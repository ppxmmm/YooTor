import { Landing } from '@/components/landing';
import { pageSession } from '@/lib/page-session';
export default async function Page() {
  const session = await pageSession();
  return <Landing signedIn={!!session} />;
}
