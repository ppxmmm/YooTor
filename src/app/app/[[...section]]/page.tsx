import { Workspace } from '@/components/workspace';
import { notFound, redirect } from 'next/navigation';
import { pageSession } from '@/lib/page-session';
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  if (section && (section.length !== 1 || !['assets', 'contacts', 'documents', 'instructions', 'family', 'checklist', 'assistant', 'tax', 'settings'].includes(section[0]))) notFound();
  const session = await pageSession();
  if (!session) redirect('/login');
  if (session.role === 'FAMILY' && section && !['family', 'checklist', 'assistant', 'tax', 'settings'].includes(section[0])) redirect('/app/family');
  return <Workspace section={section?.[0] || 'dashboard'} initialRole={session.role} />;
}
