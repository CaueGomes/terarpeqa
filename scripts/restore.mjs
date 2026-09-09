/* Restaura um backup gerado pelo backup.mjs.
 *
 * Cria o schema se não existir e regrava linha a linha. Contas e chaves que já
 * existirem no destino são sobrescritas pelas do arquivo; o que estiver só no
 * destino é preservado, então restaurar nunca apaga nada por conta própria.
 *
 *   PowerShell:  $env:DATABASE_URL="postgresql://..."; npm run restore -- backups/arquivo.json
 *   Bash:        DATABASE_URL="postgresql://..." npm run restore -- backups/arquivo.json
 */
import fs from 'node:fs';
import { pool, initSchema } from '../server/db.js';

const origem = process.argv[2];
if (!origem) {
  console.error('[restore] informe o arquivo: npm run restore -- backups/terarpeqa-....json');
  process.exit(1);
}
if (!fs.existsSync(origem)) {
  console.error(`[restore] arquivo não encontrado: ${origem}`);
  process.exit(1);
}

const dump = JSON.parse(fs.readFileSync(origem, 'utf8'));
if (!Array.isArray(dump.accounts) || !Array.isArray(dump.kv)) {
  console.error('[restore] arquivo não parece um backup do Terarpeqá.');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
const alvo = url.startsWith('pglite:') ? url : (url.match(/@([^/?]+)/) || [])[1] || 'destino desconhecido';
console.log(`[restore] gravando em ${alvo}`);
console.log(`[restore] backup de ${dump.gerado_em}: ${dump.accounts.length} contas, ${dump.kv.length} chaves`);

await initSchema();

for (const a of dump.accounts) {
  await pool.query(
    `INSERT INTO accounts (username_lc, username, password_hash, is_master, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username_lc) DO UPDATE
       SET username = EXCLUDED.username,
           password_hash = EXCLUDED.password_hash,
           is_master = EXCLUDED.is_master,
           created_at = EXCLUDED.created_at`,
    [a.username_lc, a.username, a.password_hash, a.is_master, a.created_at]
  );
}

for (const r of dump.kv) {
  await pool.query(
    `INSERT INTO kv (key, value, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    [r.key, r.value, r.updated_at]
  );
}

console.log('[restore] concluído.');
process.exit(0);
