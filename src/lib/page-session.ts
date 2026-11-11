import 'server-only';
import { cookies } from 'next/headers';
import { ApiError, service } from './server';

/** Return null only for a missing, expired, or invalid session. */
export async function pageSession() {
  const token = (await cookies()).get('saan_session')?.value;
  if (!token) return null;
  try {
    return await service.session(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
