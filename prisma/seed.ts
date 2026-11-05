import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { createService } from '../src/lib/server';
async function main() {
  if (existsSync('.env')) loadEnvFile('.env');
  const service = createService();
  try {
    await service.auth({ action: 'demo', role: 'OWNER' });
  } finally {
    await service.close();
  }
  console.log(
    'Created synthetic demonstration household. The demo UI creates isolated sessions.',
  );
}
main().catch(() => {
  console.error('Could not seed. Check database and encryption configuration.');
  process.exitCode = 1;
});
