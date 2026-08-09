import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL não está definida. Configure a variável de ambiente antes de iniciar.');
  process.exit(1);
}

// Render, Neon e Supabase exigem TLS. Em localhost, desliga.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
});

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
