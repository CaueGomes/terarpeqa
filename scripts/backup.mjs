/* Backup do banco em um arquivo JSON.
 *
 * Não usa --env-file de propósito: o .env aponta para o banco local de
 * desenvolvimento, e carregá-lo aqui faria você achar que salvou a produção
 * quando na verdade salvou um banco vazio. A URL tem que vir explícita.
 *
 *   PowerShell:  $env:DATABASE_URL="postgresql://..."; npm run backup
 *   Bash:        DATABASE_URL="postgresql://..." npm run backup
 */
import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../server/db.js';

const url = process.env.DATABASE_URL;
const alvo = url.startsWith('pglite:') ? url : (url.match(/@([^/?]+)/) || [])[1] || 'destino desconhecido';
console.log(`[backup] lendo de ${alvo}`);

const carimbo = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const destino = process.argv[2] || path.join('backups', `terarpeqa-${carimbo}.json`);
fs.mkdirSync(path.dirname(destino), { recursive: true });

/* bigint volta como string em um driver e como número no outro; normaliza para
   string para o arquivo ficar igual nos dois casos. */
const texto = (v) => (v === null || v === undefined ? null : String(v));

const { rows: accounts } = await pool.query('SELECT * FROM accounts ORDER BY created_at');
const { rows: kv } = await pool.query('SELECT * FROM kv ORDER BY key');

const dump = {
  versao: 1,
  gerado_em: new Date().toISOString(),
  accounts: accounts.map((a) => ({
    username_lc: a.username_lc,
    username: a.username,
    password_hash: a.password_hash,
    is_master: !!a.is_master,
    created_at: texto(a.created_at),
  })),
  kv: kv.map((r) => ({ key: r.key, value: r.value, updated_at: texto(r.updated_at) })),
};

fs.writeFileSync(destino, JSON.stringify(dump, null, 2));

const tamanho = (fs.statSync(destino).size / 1024).toFixed(0);
const fichas = dump.kv.filter((r) => r.key.startsWith('char:')).length;
const conteudos = dump.kv.filter((r) => r.key.startsWith('content:')).length;
console.log(`[backup] ${dump.accounts.length} contas, ${fichas} fichas, ${conteudos} conteúdos`);
console.log(`[backup] gravado em ${destino} (${tamanho} KB)`);
process.exit(0);
