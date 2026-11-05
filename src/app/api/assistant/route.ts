import { readJson } from '@/lib/http';
import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { service } from '@/lib/server';
import { createAssistant } from '@/lib/assistant';
const assistant = createAssistant(service);
export async function POST(req: NextRequest) {
  return endpoint(req, async () =>
    assistant.answer(token(req), await readJson(req)),
  );
}
