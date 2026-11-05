import { readJson } from '@/lib/http';
import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { service } from '@/lib/server';
type Context = { params: Promise<{ resource: string }> };
async function mutate(req: NextRequest, ctx: Context) {
  return endpoint(req, async () => {
    const { resource } = await ctx.params;
    return service.mutate(
      token(req),
      resource,
      req.method,
      await readJson(req),
    );
  });
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
