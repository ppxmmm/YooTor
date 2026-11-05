import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { service } from '@/lib/server';
export async function GET(req: NextRequest) {
  return endpoint(req, () => service.state(token(req)));
}
