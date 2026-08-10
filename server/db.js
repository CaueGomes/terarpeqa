import pg from 'pg';

const { Pool } = pg;

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('[db] DATABASE_URL não está definida. Configure a variável de ambiente antes de iniciar.');
  process.exit(1);
}

/* Duas formas de conectar:

   pglite:<pasta>   Postgres rodando dentro deste mesmo processo, gravando na
                    pasta indicada. É o modo de desenvolvimento: não exige
                    instalar nada nem subir serviço à parte.
   postgres://...   Postgres de verdade, pela rede. É o que o Render usa.

   Nos dois casos o resto do servidor só enxerga um objeto com .query().     */

async function criarPool() {
  if (url.startsWith('pglite:')) {
    const { PGlite } = await import('@electric-sql/pglite');
    const dataDir = url.slice('pglite:'.length) || './.pgdata';
    const db = await PGlite.create({ dataDir });
    console.log(`[db] Postgres local (PGlite) em ${dataDir}`);
    return { query: (text, params) => db.query(text, params) };
  }

  // Render, Neon e Supabase exigem TLS. Em localhost, desliga.
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  return new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
  });
}

export const pool = await criarPool();

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      username_lc   text PRIMARY KEY,
      username      text NOT NULL,
      password_hash text NOT NULL,
      is_master     boolean NOT NULL DEFAULT false,
      created_at    bigint  NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv (
      key        text PRIMARY KEY,
      value      text NOT NULL,
      updated_at bigint NOT NULL
    );
  `);
  // Acelera o sList por prefixo (char:, content:, ...), que compara em minúsculas.
  await pool.query(`
    CREATE INDEX IF NOT EXISTS kv_key_prefix_idx ON kv (lower(key) text_pattern_ops);
  `);
}
