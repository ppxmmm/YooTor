import { savedWillReviewSchema, willReviewSchema } from './will-review';
import {
  randomBytes,
  randomUUID,
  createCipheriv,
  createDecipheriv,
  scryptSync,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { checklist, samplePdf } from './checklist';

type Row = Record<string, unknown> & { id: string };
type User = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'FAMILY';
  demo: boolean;
  household: string;
  password?: string;
  createdAt?: number;
  preferences?: Record<string, unknown>;
};
type Household = {
  id: string;
  assets: Row[];
  contacts: Row[];
  documents: Row[];
  instructions: Row[];
  requests: Row[];
  tasks: Row[];
  activities: Row[];
  profile: Record<string, unknown>;
};
type DB = {
  users: User[];
  sessions: { hash: string; userId: string; expires: number }[];
  households: Household[];
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const empty = (): DB => ({ users: [], sessions: [], households: [] });
const text = z.string().trim().max(4000);
const emailAddress = z.string().trim().toLowerCase().max(254).pipe(z.email());
function publicDocument<T extends Record<string, unknown>>(row: T): T {
  const safe = { ...row };
  Reflect.deleteProperty(safe, 'content');
  return safe;
}
const rowLimits: Record<string, number> = {
  assets: 200,
  contacts: 200,
  instructions: 100,
  tasks: 100,
};
const permissions = z
  .array(z.enum(['assets', 'documents', 'instructions']))
  .max(3);
const onboardingFields = {
  ownsAssets: z.enum(['yes', 'later']).optional(),
  nominate: z.enum(['yes', 'later']).optional(),
  goal: z
    .enum([
      'เตรียมข้อมูลให้ครอบครัว',
      'จัดระเบียบทรัพย์สินและเอกสาร',
      'ทำความเข้าใจขั้นตอนต่าง ๆ',
    ])
    .optional(),
};
const schemas: Record<string, z.ZodType> = {
  assets: z.object({
    name: text.min(1),
    category: z.enum([
      'property',
      'bank',
      'insurance',
      'investment',
      'vehicle',
      'business',
      'other',
    ]),
    value: z.coerce.number().min(0).max(1e14).default(0),
    reference: text.default(''),
    notes: text.default(''),
    status: z.enum(['complete', 'incomplete']).default('incomplete'),
    valuedAt: z.iso.date().or(z.literal('')).optional(),
    ownership: z.enum(['', 'sole', 'joint', 'marital', 'unknown']).optional(),
    ownershipShare: z.number().min(0).max(100).nullable().optional(),
    debtOutstanding: z.number().min(0).max(1e14).nullable().optional(),
    beneficiaryIds: z.array(z.string().max(100)).max(50).optional(),
    beneficiaryShares: z.array(z.object({ contactId: z.string().min(1).max(100), share: z.number().min(0).max(100) })).max(50).optional(),
    documentIds: z.array(z.string().max(100)).max(30).optional(),
    insurance: z.object({
      insured: z.string().trim().min(1).max(200),
      policyType: z.enum(['life', 'accident', 'health', 'pension', 'savings', 'other']),
      policyStatus: z.enum(['active', 'lapsed', 'matured', 'claimed', 'unknown']),
      startDate: z.iso.date().or(z.literal('')),
      endDate: z.iso.date().or(z.literal('')),
      beneficiaryKind: z.enum(['named', 'heirs', 'none', 'unknown']),
      beneficiaries: z.array(z.object({ name: z.string().trim().max(200), relationship: z.string().trim().max(100), share: z.number().min(0).max(100).nullable() })).max(20),
      premiumsPaid: z.number().min(0).max(1e14).nullable(),
    }).superRefine((policy, ctx) => {
      if (policy.beneficiaryKind === 'named' && (!policy.beneficiaries.length || policy.beneficiaries.some(person => !person.name)))
        ctx.addIssue({ code: 'custom', message: 'กรุณาระบุชื่อผู้รับประโยชน์', path: ['beneficiaries'] });
      if (policy.beneficiaryKind === 'named' && policy.beneficiaries.length && policy.beneficiaries.every(person => person.share !== null) && Math.abs(policy.beneficiaries.reduce((sum, person) => sum + (person.share || 0), 0) - 100) > 0.001)
        ctx.addIssue({ code: 'custom', message: 'สัดส่วนผู้รับประโยชน์รวมต้องเท่ากับ 100%', path: ['beneficiaries'] });
      if (policy.startDate && policy.endDate && policy.startDate > policy.endDate)
        ctx.addIssue({ code: 'custom', message: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มคุ้มครอง', path: ['endDate'] });
    }).optional(),
  }).superRefine((asset, ctx) => {
    const shares = asset.beneficiaryShares || [];
    if (new Set(shares.map(item => item.contactId)).size !== shares.length || shares.some(item => !asset.beneficiaryIds?.includes(item.contactId)))
      ctx.addIssue({ code: 'custom', message: 'กรุณาตรวจรายชื่อและสัดส่วนผู้รับ', path: ['beneficiaryShares'] });
    if (shares.reduce((sum, item) => sum + item.share, 0) > 100.000001)
      ctx.addIssue({ code: 'custom', message: 'สัดส่วนผู้รับรวมต้องไม่เกิน 100%', path: ['beneficiaryShares'] });
  }),
  contacts: z.object({
    name: text.min(1),
    relationship: text.default(''),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .pipe(z.email().or(z.literal('')))
      .default(''),
    phone: text.default(''),
    kind: z
      .enum(['trusted', 'beneficiary', 'administrator'])
      .default('trusted'),
    permissions: permissions.default([]),
    status: z.enum(['pending', 'active', 'revoked']).default('pending'),
  }),
  instructions: z.object({
    title: text.min(1),
    category: text.default('general'),
    content: text.default(''),
    status: text.default('draft'),
  }),
  tasks: z.object({
    title: text.min(1),
    requiredDocuments: z.array(text).default([]),
    agency: text.default(''),
    conditions: text.default(''),
    source: text.default(''),
    nextAction: text.default(''),
    reviewedAt: text.default('2026-11-05'),
    templateVersion: text.default('2026-11-05'),
    status: z
      .enum(['pending', 'not_started', 'waiting', 'in_progress', 'completed'])
      .default('pending'),
    notes: text.default(''),
  }),
  profile: z.object({
    ...onboardingFields,
    willReview: willReviewSchema.optional(),
    willReviews: z.array(savedWillReviewSchema).max(30).optional(),
    debts: z.array(z.object({
      id: z.string().min(1).max(100),
      creditor: z.string().trim().min(1).max(200),
      kind: z.enum(['loan', 'credit', 'personal', 'expense', 'other']),
      amount: z.number().min(0).max(1e14),
      asOf: z.iso.date().or(z.literal('')),
      security: z.enum(['yes', 'no', 'unknown']),
      assetId: z.string().max(100),
      notes: z.string().trim().max(1000),
    })).max(100).optional(),
    name: text.min(1).optional(),
    phone: text.optional(),
    address: text.optional(),
    birthDate: text.optional(),
    consent: z.boolean().optional(),
  }),
};
function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
function verify(password: string, hash: string) {
  const [salt, value] = hash.split(':');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(value, 'hex'));
}
function digest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
export function createService(
  directory = process.env.DATA_DIR || join(process.cwd(), '.data'),
) {
  let queue: Promise<unknown> = Promise.resolve();
  let prisma: import('@prisma/client').PrismaClient | undefined;
  async function key() {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    if (process.env.DATA_ENCRYPTION_KEY) {
      const k = Buffer.from(process.env.DATA_ENCRYPTION_KEY, 'hex');
      if (
        !/^[a-fA-F0-9]{64}$/.test(process.env.DATA_ENCRYPTION_KEY) ||
        k.length !== 32
      )
        throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes');
      return k;
    }
    if (process.env.NODE_ENV === 'production')
      throw new Error('Encryption key required');
    try {
      return await readFile(join(directory, 'encryption.key'));
    } catch {
      const k = randomBytes(32);
      try {
        await writeFile(join(directory, 'encryption.key'), k, {
          mode: 0o600,
          flag: 'wx',
        });
        return k;
      } catch {
        return readFile(join(directory, 'encryption.key'));
      }
    }
  }
  async function encrypt(value: string) {
    const iv = randomBytes(12),
      cipher = createCipheriv('aes-256-gcm', await key(), iv);
    return Buffer.concat([
      iv,
      cipher.update(value),
      cipher.final(),
      cipher.getAuthTag(),
    ]);
  }
  async function decrypt(bytes: Buffer) {
    const cipher = createDecipheriv(
      'aes-256-gcm',
      await key(),
      bytes.subarray(0, 12),
    );
    cipher.setAuthTag(bytes.subarray(-16));
    return Buffer.concat([
      cipher.update(bytes.subarray(12, -16)),
      cipher.final(),
    ]).toString();
  }
  async function database() {
    if (!prisma) {
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient();
    }
    return prisma;
  }
  const kinds = [
    'assets',
    'contacts',
    'documents',
    'instructions',
    'requests',
    'tasks',
    'activities',
  ] as const;
  function resourceTables(
    pg: import('@prisma/client').Prisma.TransactionClient,
  ) {
    return {
      assets: pg.asset,
      contacts: pg.contact,
      documents: pg.document,
      instructions: pg.instruction,
      requests: pg.accessRequest,
      tasks: pg.checklistTask,
      activities: pg.auditActivity,
    } as unknown as Record<
      (typeof kinds)[number],
      import('@prisma/client').Prisma.TransactionClient['asset']
    >;
  }
  async function load(
    client?: import('@prisma/client').Prisma.TransactionClient,
  ): Promise<DB> {
    if (process.env.DATABASE_URL) {
      const pg = client || (await database());
      const [houses, users, sessions, records] = await Promise.all([
        pg.household.findMany(),
        pg.user.findMany(),
        pg.session.findMany(),
        Promise.all(
          kinds.map(async (kind) =>
            (await resourceTables(pg)[kind].findMany()).map((row) => ({
              ...row,
              kind,
            })),
          ),
        ).then((groups) => groups.flat()),
      ]);
      const db: DB = {
        households: [],
        users: [],
        sessions: sessions.map((s) => ({ ...s, expires: s.expires.getTime() })),
      };
      for (const h of houses) {
        const home = {
          id: h.id,
          profile: JSON.parse(
            await decrypt(Buffer.from(h.ciphertext, 'base64')),
          ),
          assets: [],
          contacts: [],
          documents: [],
          instructions: [],
          requests: [],
          tasks: [],
          activities: [],
        } as Household;
        db.households.push(home);
      }
      for (const u of users)
        db.users.push(
          JSON.parse(await decrypt(Buffer.from(u.ciphertext, 'base64'))),
        );
      for (const row of records) {
        const home = db.households.find((h) => h.id === row.householdId);
        if (home && kinds.includes(row.kind as (typeof kinds)[number]))
          home[row.kind as (typeof kinds)[number]].push(
            JSON.parse(await decrypt(Buffer.from(row.ciphertext, 'base64'))),
          );
      }
      return db;
    }
    try {
      return JSON.parse(
        await decrypt(await readFile(join(directory, 'vault.enc'))),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return empty();
      throw error;
    }
  }
  async function save(
    db: DB,
    client?: import('@prisma/client').Prisma.TransactionClient,
  ) {
    if (process.env.DATABASE_URL) {
      const pg = client || (await database());
      await pg.household.deleteMany({
        where: { id: { notIn: db.households.map((h) => h.id) } },
      });
      await pg.user.deleteMany({
        where: { id: { notIn: db.users.map((u) => u.id) } },
      });
      await pg.session.deleteMany({
        where: { hash: { notIn: db.sessions.map((s) => s.hash) } },
      });
      const rows = db.households.flatMap((h) =>
        kinds.flatMap((kind) =>
          h[kind].map((row) => ({ row, kind, householdId: h.id })),
        ),
      );
      for (const kind of kinds)
        await resourceTables(pg)[kind].deleteMany({
          where: {
            id: {
              notIn: rows.filter((r) => r.kind === kind).map((r) => r.row.id),
            },
          },
        });
      for (const h of db.households) {
        const ciphertext = (await encrypt(JSON.stringify(h.profile))).toString(
          'base64',
        );
        await pg.household.upsert({
          where: { id: h.id },
          create: { id: h.id, ciphertext },
          update: { ciphertext },
        });
      }
      for (const u of db.users) {
        const data = {
          householdId: u.household,
          ciphertext: (await encrypt(JSON.stringify(u))).toString('base64'),
        };
        await pg.user.upsert({
          where: { id: u.id },
          create: { id: u.id, ...data },
          update: data,
        });
      }
      for (const session of db.sessions) {
        const data = {
          userId: session.userId,
          expires: new Date(session.expires),
        };
        await pg.session.upsert({
          where: { hash: session.hash },
          create: { hash: session.hash, ...data },
          update: data,
        });
      }
      for (const { row, kind, householdId } of rows) {
        const data = {
          householdId,
          ciphertext: (await encrypt(JSON.stringify(row))).toString('base64'),
        };
        await resourceTables(pg)[kind].upsert({
          where: { id: row.id },
          create: { id: row.id, ...data },
          update: data,
        });
      }
      return;
    }
    const bytes = await encrypt(JSON.stringify(db));
    const path = join(directory, 'vault.enc');
    await writeFile(path + '.tmp', bytes, { mode: 0o600 });
    await rename(path + '.tmp', path);
  }
  function transaction<T>(
    fn: (db: DB) => Promise<T> | T,
    write = true,
  ): Promise<T> {
    const job = queue.then(async () => {
      if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL)
        throw new ApiError(
          503,
          'การใช้งานจริงต้องใช้ PostgreSQL และตั้งค่าการยืนยันตัวตน',
        );
      if (process.env.DATABASE_URL) {
        return (await database()).$transaction(
          async (client) => {
            await client.$executeRaw`SELECT pg_advisory_xact_lock(734922601)`;
            const db = await load(client);
            const result = await fn(db);
            if (write) await save(db, client);
            return result;
          },
          { timeout: 20000 },
        );
      }
      const db = await load();
      const result = await fn(db);
      if (write) await save(db);
      return result;
    });
    queue = job.catch(() => {});
    return job;
  }
  function identify(db: DB, token: string) {
    const session = db.sessions.find(
      (s) => s.hash === digest(token) && s.expires > Date.now(),
    );
    const user = db.users.find((u) => u.id === session?.userId);
    if (!user) throw new ApiError(401, 'กรุณาเข้าสู่ระบบ');
    if (user.demo && user.createdAt && user.createdAt < Date.now() - 86400000)
      throw new ApiError(401, 'พื้นที่ทดลองหมดอายุ กรุณาเริ่มใหม่');
    if (
      process.env.NODE_ENV === 'production' &&
      !user.demo &&
      user.role === 'FAMILY'
    )
      throw new ApiError(
        503,
        'บัญชีครอบครัวจริงยังไม่เปิดใช้งานจนกว่าจะตั้งค่าการยืนยันตัวตนและอีเมล',
      );
    const home = db.households.find((h) => h.id === user.household)!;
    return { user, home };
  }
  function allowed(user: User, home: Household, resource: string) {
    return (
      user.role === 'OWNER' ||
      (home.contacts.some(
        (c) =>
          c.email === user.email &&
          c.status === 'active' &&
          (c.permissions as string[]).includes(resource),
      ) &&
        home.requests.some(
          (r) =>
            r.userId === user.id &&
            r.status === 'approved' &&
            (r.permissions as string[]).includes(resource),
        ))
    );
  }
  function activity(home: Household, message: string) {
    home.activities.unshift({
      id: randomUUID(),
      message,
      title: message,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    home.activities = home.activities.slice(0, 100);
  }
  function seed(id: string, demo: boolean): Household {
    const home: Household = {
      id,
      assets: [],
      contacts: [],
      documents: [],
      instructions: [],
      requests: [],
      tasks: [],
      activities: [],
      profile: { name: demo ? 'สมชาย ใจดี' : '', consent: true },
    };
    home.tasks = checklist();
    if (!demo) return home;
    home.assets = [
      ['บ้านพักอาศัย กรุงเทพฯ', 'property', 6500000],
      ['บัญชีออมทรัพย์ ธนาคารกสิกรไทย', 'bank', 480000],
      ['บัญชีเงินฝาก ธนาคารกรุงเทพ', 'bank', 320000],
      ['รถยนต์ Toyota Camry', 'vehicle', 850000],
      ['ประกันชีวิตเพื่อครอบครัว', 'insurance', 2000000],
    ].map(([name, category, value], i) => ({
      id: randomUUID(),
      name,
      category,
      value,
      reference: 'ข้อมูลสมมติ • ไม่มีเลขบัญชีจริง',
      notes: 'ข้อมูลตัวอย่างสำหรับทดลองใช้งาน',
      status: i < 3 ? 'complete' : 'incomplete',
    }));
    home.contacts = [
      {
        id: randomUUID(),
        name: 'มาลี ใจดี',
        relationship: 'คู่สมรส',
        email: 'mali@example.test',
        phone: '',
        kind: 'trusted',
        permissions: ['assets', 'documents', 'instructions'],
        status: 'active',
      },
    ];
    home.documents = [
      'สำเนาทะเบียนบ้าน (ตัวอย่าง)',
      'กรมธรรม์ประกันชีวิต (ตัวอย่าง)',
      'รายการทรัพย์สิน (ตัวอย่าง)',
    ].map((name) => ({
      id: randomUUID(),
      name,
      category: 'เอกสารสำคัญ',
      fileName: 'yootor-sample.pdf',
      mime: 'application/pdf',
      size: samplePdf().length,
      content: samplePdf().toString('base64'),
      createdAt: new Date().toISOString(),
    }));
    home.instructions = [
      {
        id: randomUUID(),
        title: 'ความตั้งใจถึงครอบครัว',
        category: 'family',
        content: 'ขอให้ปรึกษากันและตรวจสอบเอกสารกับผู้เชี่ยวชาญก่อนดำเนินการ',
        status: 'draft',
      },
    ];
    activity(home, 'เริ่มต้นพื้นที่ทดลองด้วยข้อมูลสมมติ');
    return home;
  }
  return {
    close: async () => {
      await prisma?.$disconnect();
    },
    auth: async (input: unknown, household?: string) =>
      transaction((db) => {
        const data = z
          .object({
            action: z.enum(['register', 'login', 'demo', 'logout']),
            role: z.enum(['OWNER', 'FAMILY']).optional(),
            name: text.optional(),
            email: emailAddress.optional(),
            password: z.string().max(256).optional(),
            consent: z.boolean().optional(),
            ...onboardingFields,
          })
          .parse(input);
        const now = Date.now();
        const expiredHomes = new Set(
          db.users
            .filter(
              (u) => u.demo && u.createdAt && u.createdAt < now - 86400000,
            )
            .map((u) => u.household),
        );
        db.households = db.households.filter((h) => !expiredHomes.has(h.id));
        db.users = db.users.filter((u) => !expiredHomes.has(u.household));
        db.sessions = db.sessions.filter(
          (s) => s.expires > now && db.users.some((u) => u.id === s.userId),
        );
        for (const u of db.users) if (u.demo && !u.createdAt) u.createdAt = now;
        let user: User | undefined;
        if (data.action === 'register') {
          if (process.env.NODE_ENV === 'production' && data.role === 'FAMILY')
            throw new ApiError(
              503,
              'ยังไม่เปิดบัญชีครอบครัวจริง: ต้องตั้งค่าการยืนยันอีเมลและตัวตนก่อน',
            );
          if (
            !data.consent ||
            !data.name ||
            !data.password ||
            data.password.length < 10 ||
            !data.email
          )
            throw new ApiError(
              422,
              'กรอกข้อมูลและยอมรับการจัดเก็บข้อมูล รหัสผ่านอย่างน้อย 10 ตัวอักษร',
            );
          if (db.users.some((u) => u.email === data.email!.toLowerCase()))
            throw new ApiError(409, 'อีเมลนี้ถูกใช้งานแล้ว');
          const invited =
            data.role === 'FAMILY'
              ? db.households.find(
                  (h) =>
                    db.users.some(
                      (u) =>
                        u.household === h.id && !u.demo && u.role === 'OWNER',
                    ) &&
                    h.contacts.some(
                      (c) =>
                        c.email === data.email!.toLowerCase() &&
                        c.status === 'active',
                    ),
                )
              : undefined;
          const id = invited?.id || randomUUID();
          user = {
            id: randomUUID(),
            name: data.name,
            email: data.email.toLowerCase(),
            role: data.role || 'OWNER',
            demo: false,
            household: id,
            password: passwordHash(data.password),
            createdAt: now,
            preferences: schemas.profile.parse(data) as Record<string, unknown>,
          };
          if (!invited) db.households.push(seed(id, false));
          if (user.role === 'OWNER') {
            const home = db.households.find((h) => h.id === user!.household)!;
            home.profile = { ...home.profile, ...user.preferences };
          }
          db.users.push(user);
        } else if (data.action === 'login') {
          user = db.users.find(
            (u) => !u.demo && u.email === data.email?.toLowerCase(),
          );
          if (
            !user?.password ||
            !data.password ||
            !verify(data.password, user.password)
          )
            throw new ApiError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else if (data.action === 'demo') {
          let home = household
            ? db.households.find(
                (h) =>
                  h.id === household &&
                  db.users.some((u) => u.household === h.id && u.demo),
              )
            : undefined;
          if (!home) {
            if (
              new Set(db.users.filter((u) => u.demo).map((u) => u.household))
                .size >= 100
            )
              throw new ApiError(
                429,
                'พื้นที่ทดลองเต็มชั่วคราว กรุณาลองภายหลัง',
              );
            home = seed(randomUUID(), true);
            db.households.push(home);
          }
          if (
            data.role === 'FAMILY' &&
            !db.users.some(
              (u) => u.household === home!.id && u.role === 'OWNER' && u.demo,
            )
          )
            db.users.push({
              id: randomUUID(),
              name: 'สมชาย ใจดี',
              email: 'somchai@example.test',
              role: 'OWNER',
              demo: true,
              household: home.id,
              createdAt: now,
            });
          const role = data.role || 'OWNER';
          user = db.users.find(
            (u) => u.household === home!.id && u.role === role && u.demo,
          );
          if (!user) {
            user = {
              id: randomUUID(),
              name: role === 'OWNER' ? 'สมชาย ใจดี' : 'มาลี ใจดี',
              email:
                role === 'OWNER' ? 'somchai@example.test' : 'mali@example.test',
              role,
              demo: true,
              createdAt:
                db.users.find((u) => u.household === home!.id)?.createdAt ||
                now,
              household: home.id,
            };
            db.users.push(user);
          }
        }
        if (!user) throw new ApiError(422, 'คำขอไม่ถูกต้อง');
        if (
          process.env.NODE_ENV === 'production' &&
          !user.demo &&
          user.role === 'FAMILY'
        )
          throw new ApiError(
            503,
            'ยังไม่เปิดบัญชีครอบครัวจริง: ต้องตั้งค่าการยืนยันอีเมลและตัวตนก่อน',
          );
        const userHome = db.households.find((h) => h.id === user!.household)!;
        if (
          user.role === 'FAMILY' &&
          !userHome.tasks.some((t) => t.userId === user!.id)
        )
          userHome.tasks.push(...checklist(user.id));
        const token = randomBytes(32).toString('hex');
        const ownSessions = db.sessions
          .filter((s) => s.userId === user!.id)
          .slice(-9);
        db.sessions = db.sessions
          .filter((s) => s.userId !== user!.id)
          .concat(ownSessions);
        db.sessions.push({
          hash: digest(token),
          userId: user.id,
          expires: Date.now() + 86400000,
        });
        return {
          token,
          household: user.household,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            demo: user.demo,
          },
        };
      }),
    logout: async (token: string) =>
      transaction((db) => {
        db.sessions = db.sessions.filter((s) => s.hash !== digest(token));
        return { ok: true };
      }),
    state: async (token: string) =>
      transaction((db) => {
        const { user, home } = identify(db, token);
        const owner = user.role === 'OWNER';
        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            demo: user.demo,
          },
          assets: allowed(user, home, 'assets') ? home.assets : [],
          documents: allowed(user, home, 'documents')
            ? home.documents.map(publicDocument)
            : [],
          instructions: allowed(user, home, 'instructions')
            ? home.instructions
            : [],
          contacts: owner ? home.contacts : [],
          requests: owner
            ? home.requests
            : home.requests.filter((r) => r.userId === user.id),
          tasks: home.tasks.filter((t) =>
            owner ? !t.userId || t.userId === user.id : t.userId === user.id,
          ),
          activities: owner ? home.activities : [],
          profile: owner ? home.profile : user.preferences || {},
        };
      }, false),
    mutate: async (
      token: string,
      resource: string,
      method: string,
      input: unknown,
    ) =>
      transaction((db) => {
        const identity = identify(db, token);
        const user = identity.user;
        let home = identity.home;
        const body = z.record(z.string(), z.unknown()).parse(input);
        const id = typeof body.id === 'string' ? body.id : '';
        if (resource === 'requests') {
          if (method === 'POST') {
            if (body.ownerEmail) {
              const email = emailAddress.parse(body.ownerEmail);
              const target = db.users.find(
                (u) =>
                  u.role === 'OWNER' &&
                  u.email === email &&
                  u.demo === user.demo &&
                  (!user.demo || u.household === home.id),
              );
              if (!target) throw new ApiError(404, 'ไม่พบเจ้าของข้อมูล');
              if (user.demo && target.household !== home.id)
                throw new ApiError(403, 'พื้นที่ทดลองแยกจากครอบครัวอื่น');
              if (target.household !== home.id) {
                const targetHome = db.households.find(
                  (h) => h.id === target.household,
                )!;
                if (
                  user.role !== 'FAMILY' ||
                  !targetHome.contacts.some(
                    (c) => c.email === user.email && c.status === 'active',
                  )
                )
                  throw new ApiError(
                    403,
                    'ต้องได้รับการเพิ่มเป็นผู้ติดต่อที่ไว้วางใจก่อน',
                  );
                const personalTasks = home.tasks.filter(
                  (t) => t.userId === user.id,
                );
                home.tasks = home.tasks.filter((t) => t.userId !== user.id);
                targetHome.tasks.push(
                  ...(personalTasks.length
                    ? personalTasks
                    : checklist(user.id)),
                );
                user.household = target.household;
                home = targetHome;
              }
            }
            if (
              home.requests.length >= 50 ||
              home.requests.filter(
                (r) => !['rejected', 'revoked'].includes(String(r.status)),
              ).length >= 10
            )
              throw new ApiError(
                429,
                'ถึงขีดจำกัดคำขอ กรุณาจัดการคำขอเดิมก่อน',
              );
            const p = permissions.parse(
              body.permissions || ['assets', 'documents', 'instructions'],
            );
            const row = {
              id: randomUUID(),
              userId: user.id,
              name: user.name,
              email: user.email,
              permissions: p,
              status: 'pending',
              reason: text.parse(body.reason || 'ขอเข้าถึงข้อมูลครอบครัว'),
              createdAt: new Date().toISOString(),
            };
            home.requests.push(row);
            activity(home, 'มีคำขอเข้าถึงข้อมูล รอเจ้าของอนุมัติ');
            return row;
          }
          if (user.role !== 'OWNER')
            throw new ApiError(403, 'เจ้าของข้อมูลเท่านั้น');
          const row = home.requests.find((r) => r.id === id);
          if (!row) throw new ApiError(404, 'ไม่พบคำขอ');
          row.status = z
            .enum([
              'approved',
              'rejected',
              'revoked',
              'verification_pending',
              'manual_review',
            ])
            .parse(body.status);
          if (body.permissions !== undefined)
            row.permissions = permissions.parse(body.permissions);
          activity(home, 'เจ้าของตรวจสอบสิทธิ์การเข้าถึง: ' + row.status);
          return row;
        }
        if (user.role !== 'OWNER' && resource === 'tasks') {
          if (method !== 'PATCH')
            throw new ApiError(403, 'แก้ไขได้เฉพาะความคืบหน้าของตนเอง');
          const task = home.tasks.find(
            (t) => t.id === id && t.userId === user.id,
          );
          if (!task) throw new ApiError(404, 'ไม่พบงานของคุณ');
          Object.assign(
            task,
            z
              .object({
                status: z
                  .enum([
                    'pending',
                    'not_started',
                    'waiting',
                    'in_progress',
                    'completed',
                  ])
                  .optional(),
                notes: text.optional(),
              })
              .parse(body),
          );
          return task;
        }
        if (resource === 'profile') {
          const profile = schemas.profile.parse(body) as Record<
            string,
            unknown
          >;
          if (typeof profile.name === 'string') user.name = profile.name;
          user.preferences = { ...user.preferences, ...profile };
          if (user.role === 'OWNER') {
            home.profile = { ...home.profile, ...profile };
            return home.profile;
          }
          return user.preferences;
        }
        if (user.role !== 'OWNER')
          throw new ApiError(403, 'เจ้าของข้อมูลเท่านั้น');
        if (!schemas[resource] && resource !== 'documents')
          throw new ApiError(404, 'ไม่พบรายการ');
        const rows = home[resource as keyof Household] as Row[];
        const index = rows.findIndex(
          (r) =>
            r.id === id &&
            (resource !== 'tasks' || !r.userId || r.userId === user.id),
        );
        if (method === 'DELETE') {
          if (index < 0) throw new ApiError(404, 'ไม่พบข้อมูล');
          rows.splice(index, 1);
          activity(home, 'ลบข้อมูล ' + resource);
          return { id };
        }
        if (resource === 'documents')
          throw new ApiError(405, 'ใช้การอัปโหลดเอกสาร');
        if (method === 'PATCH' && index < 0)
          throw new ApiError(404, 'ไม่พบข้อมูล');
        if (method === 'POST' && rows.length >= (rowLimits[resource] || 100))
          throw new ApiError(429, 'ถึงขีดจำกัดรายการในครอบครัว');
        const data = schemas[resource].parse(
          method === 'PATCH' ? { ...rows[index], ...body } : body,
        ) as object;
        if (resource === 'assets') {
          const asset = data as { beneficiaryIds?: string[]; documentIds?: string[] };
          if ('beneficiaryIds' in body && asset.beneficiaryIds?.some(id => !home.contacts.some(contact => contact.id === id)))
            throw new ApiError(400, 'ไม่พบผู้รับที่เลือกในบัญชีนี้');
          if ('documentIds' in body && asset.documentIds?.some(id => !home.documents.some(document => document.id === id)))
            throw new ApiError(400, 'ไม่พบเอกสารที่เลือกในบัญชีนี้');
        }
        const row = { ...data, id: method === 'PATCH' ? id : randomUUID() };
        if (method === 'PATCH') rows[index] = row;
        else rows.push(row);
        activity(home, 'บันทึกข้อมูล ' + resource);
        return row;
      }),
    upload: async (
      token: string,
      file: { name: string; mime: string; bytes: Buffer },
      name: string,
      category: string,
    ) =>
      transaction((db) => {
        const { user, home } = identify(db, token);
        if (user.role !== 'OWNER')
          throw new ApiError(403, 'เจ้าของข้อมูลเท่านั้น');
        if (
          home.documents.length >= 30 ||
          home.documents.reduce((sum, d) => sum + Number(d.size || 0), 0) +
            file.bytes.length >
            50 * 1024 * 1024
        )
          throw new ApiError(413, 'ถึงขีดจำกัดคลังเอกสาร 30 ไฟล์ หรือ 50 MB');
        if (file.bytes.length > 10 * 1024 * 1024)
          throw new ApiError(413, 'ไฟล์ต้องไม่เกิน 10 MB');
        const pdf =
            file.bytes.subarray(0, 5).toString() === '%PDF-' &&
            /%%EOF\s*$/.test(file.bytes.subarray(-1024).toString()),
          png =
            file.bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
            file.bytes.subarray(-8, -4).toString() === 'IEND',
          jpeg =
            file.bytes[0] === 255 &&
            file.bytes[1] === 216 &&
            file.bytes[2] === 255 &&
            file.bytes.at(-2) === 255 &&
            file.bytes.at(-1) === 217;
        if (!pdf && !png && !jpeg)
          throw new ApiError(422, 'รองรับ PDF, PNG, JPEG เท่านั้น');
        const row = {
          id: randomUUID(),
          name: z.string().trim().min(1).max(200).parse(name),
          category: z.string().trim().min(1).max(100).parse(category),
          fileName: z
            .string()
            .min(1)
            .max(255)
            .parse(file.name)
            .replace(/[^\p{L}\p{N} ._-]/gu, '_')
            .slice(0, 150),
          mime: pdf ? 'application/pdf' : png ? 'image/png' : 'image/jpeg',
          size: file.bytes.length,
          content: file.bytes.toString('base64'),
          createdAt: new Date().toISOString(),
        };
        home.documents.push(row);
        activity(home, 'เพิ่มเอกสาร ' + name);
        return publicDocument(row);
      }),
    download: async (token: string, id: string) =>
      transaction((db) => {
        const { user, home } = identify(db, token);
        if (!allowed(user, home, 'documents'))
          throw new ApiError(403, 'ยังไม่ได้รับสิทธิ์เอกสาร');
        const doc = home.documents.find((d) => d.id === id);
        if (!doc) throw new ApiError(404, 'ไม่พบเอกสาร');
        activity(
          home,
          'ดาวน์โหลดเอกสาร: ' + String(doc.name) + ' โดย ' + user.name,
        );
        return {
          bytes: Buffer.from(doc.content as string, 'base64'),
          mime: doc.mime as string,
          name: doc.fileName as string,
        };
      }),
    deleteAccount: async (token: string) =>
      transaction((db) => {
        const { user } = identify(db, token);
        if (user.role === 'OWNER') {
          const ids = db.users
            .filter((u) => u.household === user.household)
            .map((u) => u.id);
          db.users = db.users.filter((u) => u.household !== user.household);
          db.sessions = db.sessions.filter((s) => !ids.includes(s.userId));
          db.households = db.households.filter((h) => h.id !== user.household);
        } else {
          for (const home of db.households) {
            home.requests = home.requests.filter((r) => r.userId !== user.id);
            home.tasks = home.tasks.filter((t) => t.userId !== user.id);
          }
          db.users = db.users.filter((u) => u.id !== user.id);
          db.sessions = db.sessions.filter((s) => s.userId !== user.id);
        }
        return { ok: true };
      }),
  };
}
export const service = createService();
