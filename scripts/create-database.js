// Creates the website's PostgreSQL database and login on a PostgreSQL server
// you control, then saves the connection string in .env.
//
//   npm run db:create
//
// You are asked for the password of the server's admin user ("postgres" by
// default). It is used once and never saved. Optional settings:
//   PGHOST (localhost)  PGPORT (5432)  PGUSER (postgres)  DB_NAME (paz)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const ROOT = path.resolve(import.meta.dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const host = process.env.PGHOST || 'localhost';
const port = Number(process.env.PGPORT) || 5432;
const adminUser = process.env.PGUSER || 'postgres';
const name = process.env.DB_NAME || 'paz';

if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error('DB_NAME may only use lowercase letters, numbers and _');

function askHidden(question) {
  if (process.env.PGPASSWORD) return Promise.resolve(process.env.PGPASSWORD);
  if (!process.stdin.isTTY) {
    console.error('Run this in a terminal so it can ask for the password.');
    process.exit(1);
  }
  return new Promise((resolve) => {
    process.stdout.write(question);
    let input = '';
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === '\r' || c === '\n') return done(() => resolve(input));
        if (c === '\u0003') return done(() => process.exit(130)); // Ctrl+C
        input = c === '\u007f' || c === '\b' ? input.slice(0, -1) : input + c;
      }
    };
    const done = (next) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off('data', onData);
      process.stdout.write('\n');
      next();
    };
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
    process.stdin.resume();
  });
}

function saveToEnv(url) {
  let env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
  env = /^DATABASE_URL=.*$/m.test(env) ? env.replace(/^DATABASE_URL=.*$/m, () => `DATABASE_URL=${url}`) : `${env.trimEnd()}\nDATABASE_URL=${url}\n`;
  fs.writeFileSync(ENV_FILE, env);
}

console.log(`Setting up database "${name}" on ${host}:${port}`);
const admin = new pg.Client({
  host, port, user: adminUser, database: 'postgres',
  password: await askHidden(`Password for PostgreSQL user "${adminUser}": `)
});
try {
  await admin.connect();
} catch (err) {
  console.error(`Could not connect: ${err.message}`);
  process.exit(1);
}

// A new random password each run; only the website's login uses it.
const password = crypto.randomBytes(24).toString('base64url');
const roleExists = (await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [name])).rowCount > 0;
await admin.query(`${roleExists ? 'ALTER' : 'CREATE'} ROLE ${name} WITH LOGIN PASSWORD ${admin.escapeLiteral(password)}`);
console.log(roleExists ? `Login "${name}" already existed: password reset.` : `Created login "${name}".`);

const dbExists = (await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])).rowCount > 0;
await admin.query(dbExists ? `ALTER DATABASE ${name} OWNER TO ${name}` : `CREATE DATABASE ${name} OWNER ${name}`);
console.log(dbExists ? `Database "${name}" already existed: kept its content.` : `Created database "${name}".`);
await admin.end();

const url = `postgresql://${name}:${password}@${host}:${port}/${name}`;
const check = new pg.Client({ connectionString: url });
await check.connect();
const { rows: [info] } = await check.query('SELECT current_user AS who, current_database() AS db, version() AS version');
await check.end();
console.log(`Connected as "${info.who}" to "${info.db}" (${info.version.split(',')[0]}).`);

saveToEnv(url);
console.log('Saved DATABASE_URL in .env. Restart the website (npm run dev) to use it.');
