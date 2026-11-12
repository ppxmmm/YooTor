import assert from 'node:assert/strict';
import { createService } from '../src/lib/server';

async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error('Set DATABASE_URL to an isolated local test database.');
  const first = createService(),
    reloaded = createService();
  try {
    const email = `postgres-smoke-${Date.now()}@example.test`;
    const registered = await first.auth({ action: 'register', role: 'OWNER', name: 'Test', email, password: 'test-password-123', consent: true });
    const loggedIn = await reloaded.auth({ action: 'login', email, password: 'test-password-123' });
    assert.equal((await first.session(loggedIn.token)).id, registered.user.id);
    const owner = await first.auth({ action: 'demo', role: 'OWNER' });
    assert.equal((await reloaded.session(owner.token)).role, 'OWNER');
    await assert.rejects(reloaded.session('invalid-token'));
    const other = await first.auth({ action: 'demo', role: 'OWNER' });
    const family = await first.auth(
      { action: 'demo', role: 'FAMILY' },
      owner.household,
    );
    assert.equal((await reloaded.session(family.token)).role, 'FAMILY');
    const asset = await first.mutate(owner.token, 'assets', 'POST', {
      name: 'PostgreSQL persistence check',
      category: 'other',
      value: 1234,
    });
    assert.equal(
      (await reloaded.state(owner.token)).assets.find((a) => a.id === asset.id)
        ?.value,
      1234,
    );
    assert.equal((await reloaded.state(other.token)).assets.some((a) => a.id === asset.id), false);
    await assert.rejects(reloaded.state('invalid-token'));
    await assert.rejects(
      first.mutate(other.token, 'assets', 'PATCH', {
        id: asset.id,
        value: 999,
      }),
    );
    assert.equal((await first.state(family.token)).assets.length, 0);
    const request = await first.mutate(family.token, 'requests', 'POST', {
      ownerEmail: 'somchai@example.test',
      permissions: ['assets'],
    });
    await first.mutate(owner.token, 'requests', 'PATCH', {
      id: request.id,
      status: 'approved',
      permissions: ['assets'],
    });
    assert.equal((await reloaded.state(family.token)).assets.length, 6);
    assert.equal((await reloaded.state(family.token)).documents.length, 0);
    const task = (await first.state(family.token)).tasks[0];
    await first.mutate(family.token, 'tasks', 'PATCH', {
      id: task.id,
      status: 'completed',
      notes: 'PostgreSQL persisted',
    });
    assert.equal(
      (await reloaded.state(family.token)).tasks.find((item) => item.id === task.id)?.status,
      'completed',
    );
    const doc = (await first.state(owner.token)).documents[0];
    assert.equal(
      (await first.download(owner.token, doc.id)).bytes
        .subarray(0, 5)
        .toString(),
      '%PDF-',
    );
    await assert.rejects(first.download(family.token, doc.id));
    await first.deleteAccount(owner.token);
    await assert.rejects(reloaded.session(owner.token));
    await first.deleteAccount(other.token);
    await first.deleteAccount(loggedIn.token);
    await assert.rejects(reloaded.state(owner.token));
    console.log(
      'PostgreSQL smoke passed: encrypted persistence, ownership, family scopes, checklist, documents and deletion.',
    );
  } finally {
    await first.close();
    await reloaded.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
