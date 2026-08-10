import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, initSchema } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!SESSION_SECRET) {
  console.error('[auth] SESSION_SECRET não está definida. Gere um valor aleatório longo e configure-a.');
  process.exit(1);
}

const COOKIE = 'terarpeqa_session';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

const app = express();
app.set('trust proxy', 1); // Render fica atrás de um proxy TLS
app.use(express.json({ limit: '6mb' })); // fichas carregam retratos em base64
app.use(cookieParser());

/* ---------------- helpers ---------------- */

const publicAccount = (row) => ({
  username: row.username,
  isMaster: row.is_master,
  createdAt: Number(row.created_at),
});

function setSession(res, usernameLc) {
  const token = jwt.sign({ u: usernameLc }, SESSION_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, COOKIE_OPTS);
}

async function currentAccount(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, SESSION_SECRET);
  } catch {
    return null;
  }
  const { rows } = await pool.query('SELECT * FROM accounts WHERE username_lc = $1', [payload.u]);
  return rows[0] ? { ...publicAccount(rows[0]), usernameLc: rows[0].username_lc } : null;
}

async function requireAuth(req, res, next) {
  const acc = await currentAccount(req);
  if (!acc) return res.status(401).json({ error: 'Não autenticado.' });
  req.account = acc;
  next();
}

/* Autorização por chave.
   content:*      -> todos leem, só o mestre escreve
   char:<dono>:*  -> o dono e o mestre leem/escrevem
   qualquer outra -> negada                                        */
/* Fichas de deus, inimigo e especial só existem pela mão da mestra. A checagem
   mora aqui porque o navegador não é confiável: esconder o botão não impede
   ninguém de montar a requisição na mão. */
const TIPOS_FICHA_MESTRE = ['deus', 'inimigo', 'especial'];

function ehFichaDeMestre(value) {
  try {
    return TIPOS_FICHA_MESTRE.includes(JSON.parse(value)?.tipoFicha);
  } catch {
    return false; // valor que não é JSON não é ficha
  }
}

function canAccess(account, key, write) {
  if (key.startsWith('content:')) return write ? account.isMaster : true;
  if (key.startsWith('char:')) {
    const owner = key.split(':')[1] || '';
    return account.isMaster || owner.toLowerCase() === account.usernameLc;
  }
  return false;
}

const asyncRoute = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/* ---------------- auth ---------------- */

app.post(
  '/api/auth/signup',
  asyncRoute(async (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (username.length < 3) return res.status(400).json({ error: 'O nome do agente precisa de pelo menos 3 caracteres.' });
    if (password.length < 4) return res.status(400).json({ error: 'A senha precisa de pelo menos 4 caracteres.' });

    const usernameLc = username.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    // O primeiro agente a se cadastrar vira mestre. A subconsulta roda dentro
    // do INSERT para que dois cadastros simultâneos não gerem dois mestres.
    const { rows } = await pool.query(
      `INSERT INTO accounts (username_lc, username, password_hash, is_master, created_at)
       VALUES ($1, $2, $3, NOT EXISTS (SELECT 1 FROM accounts), $4)
       ON CONFLICT (username_lc) DO NOTHING
       RETURNING *`,
      [usernameLc, username, passwordHash, Date.now()]
    );
    if (!rows[0]) return res.status(409).json({ error: 'Esse nome já foi escolhido por outro agente.' });

    setSession(res, usernameLc);
    res.json(publicAccount(rows[0]));
  })
);

app.post(
  '/api/auth/login',
  asyncRoute(async (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const { rows } = await pool.query('SELECT * FROM accounts WHERE username_lc = $1', [username.toLowerCase()]);
    if (!rows[0]) return res.status(404).json({ error: 'Nenhum agente encontrado com esse nome.' });
    if (!(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
    setSession(res, rows[0].username_lc);
    res.json(publicAccount(rows[0]));
  })
);

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ ok: true });
});

app.get(
  '/api/auth/me',
  asyncRoute(async (req, res) => {
    const acc = await currentAccount(req);
    res.json(acc ? { username: acc.username, isMaster: acc.isMaster, createdAt: acc.createdAt } : null);
  })
);

/* ---------------- key/value ---------------- */

// Lista chaves por prefixo. Quem não é mestre nunca enxerga ficha alheia,
// mesmo que peça o prefixo "char:" inteiro.
app.get(
  '/api/kv',
  requireAuth,
  asyncRoute(async (req, res) => {
    const prefix = String(req.query.prefix || '');
    if (!prefix.startsWith('char:') && !prefix.startsWith('content:')) {
      return res.status(400).json({ error: 'Prefixo inválido.' });
    }
    const effective =
      prefix.startsWith('char:') && !req.account.isMaster && prefix === 'char:'
        ? `char:${req.account.usernameLc}:`
        : prefix;

    // Comparação sem diferenciar maiúsculas: o nome do agente entra na chave
    // com a grafia original, mas o prefixo pode chegar em qualquer caixa.
    const { rows } = await pool.query('SELECT key FROM kv WHERE lower(key) LIKE lower($1) ORDER BY key', [
      effective.replace(/[%_\\]/g, '\\$&') + '%',
    ]);
    res.json({ keys: rows.map((r) => r.key).filter((k) => canAccess(req.account, k, false)) });
  })
);

app.get(
  '/api/kv/*',
  requireAuth,
  asyncRoute(async (req, res) => {
    const key = req.params[0];
    if (!canAccess(req.account, key, false)) return res.status(403).json({ error: 'Sem permissão.' });
    const { rows } = await pool.query('SELECT value FROM kv WHERE key = $1', [key]);
    res.json({ value: rows[0] ? rows[0].value : null });
  })
);

app.put(
  '/api/kv/*',
  requireAuth,
  asyncRoute(async (req, res) => {
    const key = req.params[0];
    if (!canAccess(req.account, key, true)) return res.status(403).json({ error: 'Sem permissão.' });
    const value = String(req.body?.value ?? '');
    if (key.startsWith('char:') && !req.account.isMaster && ehFichaDeMestre(value)) {
      return res.status(403).json({ error: 'Só a conta mestra cria fichas de deus, inimigo ou especial.' });
    }
    await pool.query(
      `INSERT INTO kv (key, value, updated_at) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [key, value, Date.now()]
    );
    res.json({ ok: true });
  })
);

app.delete(
  '/api/kv/*',
  requireAuth,
  asyncRoute(async (req, res) => {
    const key = req.params[0];
    if (!canAccess(req.account, key, true)) return res.status(403).json({ error: 'Sem permissão.' });
    await pool.query('DELETE FROM kv WHERE key = $1', [key]);
    res.json({ ok: true });
  })
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

/* ---------------- front ---------------- */

app.use(express.static(path.join(ROOT, 'dist')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(ROOT, 'dist', 'index.html'));
});

app.use((err, req, res, _next) => {
  console.error('[erro]', err);
  res.status(500).json({ error: 'Algo deu errado no servidor.' });
});

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`[terarpeqa] ouvindo na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('[db] falha ao preparar o schema:', err);
    process.exit(1);
  });
