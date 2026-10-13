/* Lista as fichas que precisam de revisão, sem mexer em nenhuma.
 *
 * Os atributos passaram a começar em 0 em 26/09/2026, e o orçamento virou
 * 4 pontos no nível 1 mais ganhos avulsos. Ficha criada antes disso pode ter
 * mais pontos do que o nível permite — e o site não corrige sozinho, de
 * propósito: quem decide o que cortar é a mestra, não um script.
 *
 * Também confere degraus de perícia, vagas de habilidade e de feitiço, e
 * animais-laço acima do limite do nível.
 *
 *   PowerShell:  $env:DATABASE_URL="postgresql://..."; node scripts/revisar-fichas.mjs
 *   Bash:        DATABASE_URL="postgresql://..." node scripts/revisar-fichas.mjs
 *
 * Não carrega o .env de propósito, pelo mesmo motivo do backup: o .env aponta
 * para o banco local e você acharia que revisou a produção.
 */
import { pool } from '../server/db.js';

/* ---------- as mesmas regras do site, repetidas aqui de propósito ----------
   Importar o App.jsx traria React junto. São poucas linhas; quando elas
   mudarem no site, mudam aqui. */
const GANHO_ATRIBUTO_POR_NIVEL = { 3: 1, 5: 1, 7: 1, 9: 1, 10: 2 };
const PONTOS_ATRIBUTO_INICIAIS = 4;
const ATTR_MAX = 5;

const nivelDa = (c) => Math.min(10, Math.max(1, Number(c?.nivel) || 1));

function pontosDeAtributo(nivel) {
  let pontos = PONTOS_ATRIBUTO_INICIAIS;
  for (let n = 2; n <= nivel; n++) pontos += GANHO_ATRIBUTO_POR_NIVEL[n] || 0;
  return pontos;
}
const degrausDePericia = (nivel) => 4 + 2 * (nivel - 1);
const vagasDeHabilidade = (nivel) => 2 + Math.floor((nivel - 1) / 2);
const vagasDeFeitico = (nivelMagico) => 2 + Math.floor((nivelMagico || 5) / 10);
const limiteDeAnimais = (c) => (c.subdivisaoAnimalTipo === 'mistico' ? 1 : nivelDa(c));

/* Perícias que a classe dá de graça não consomem degrau. */
const CONCEDIDAS = { druida: ['agape'], mago: ['savoir_faire', 'dicionario_mental'] };

function problemas(c) {
  const fora = [];
  const nivel = nivelDa(c);
  const livre = ['deus', 'inimigo', 'especial'].includes(c.tipoFicha);
  if (livre) return fora; // ficha da mestra não tem orçamento

  const attrs = c.attributes || {};
  const gastos = ['intelecto', 'psique', 'fisico', 'motoras']
    .reduce((s, k) => s + Math.max(0, Number(attrs[k]) || 0), 0);
  const teto = pontosDeAtributo(nivel);
  if (gastos > teto) fora.push(`atributos: ${gastos} pontos para um teto de ${teto}`);
  for (const [k, v] of Object.entries(attrs)) {
    if (Number(v) > ATTR_MAX) fora.push(`${k} em ${v}, acima do máximo ${ATTR_MAX}`);
  }

  const concedidas = CONCEDIDAS[c.originId] || [];
  const degraus = Object.entries(c.pericias || {})
    .reduce((s, [id, grau]) => s + Math.max(0, Number(grau) || 0) - (concedidas.includes(id) ? 1 : 0), 0);
  const tetoDegraus = degrausDePericia(nivel);
  if (degraus > tetoDegraus) fora.push(`perícias: ${degraus} degraus para um teto de ${tetoDegraus}`);

  const habs = (c.habilidades || []).length;
  if (habs > vagasDeHabilidade(nivel)) fora.push(`habilidades: ${habs} para ${vagasDeHabilidade(nivel)} vagas`);

  if (c.originId === 'mago') {
    const vagas = (c.feiticos || []).reduce((s, f) => s + (typeof f === 'string' ? 1 : Number(f?.evolucao) || 1), 0);
    const teto = vagasDeFeitico(c.subdivisaoNivel);
    if (vagas > teto) fora.push(`feitiços: ${vagas} vagas usadas para um teto de ${teto}`);
  }

  if (c.originId === 'druida') {
    const animais = (c.animais || []).length;
    if (animais > limiteDeAnimais(c)) fora.push(`animais: ${animais} para um limite de ${limiteDeAnimais(c)}`);
  }
  return fora;
}

const url = process.env.DATABASE_URL;
const alvo = url?.startsWith('pglite:') ? url : (url?.match(/@([^/?]+)/) || [])[1] || 'destino desconhecido';
console.log(`[revisar] lendo de ${alvo}\n`);

const { rows } = await pool.query("SELECT key, value FROM kv WHERE key LIKE 'char:%' ORDER BY key");
let comProblema = 0;
for (const r of rows) {
  let c;
  try { c = JSON.parse(r.value); } catch { console.log(`  ${r.key}: não é JSON válido`); continue; }
  const fora = problemas(c);
  if (!fora.length) continue;
  comProblema++;
  console.log(`  ${c.name || '(sem nome)'} — ${c.originId || c.tipoFicha || 'sem classe'} nível ${nivelDa(c)} — dono: ${c.owner}`);
  for (const f of fora) console.log(`      ${f}`);
}

const plural = comProblema === 1 ? 'precisa' : 'precisam';
console.log(`\n[revisar] ${rows.length} fichas lidas, ${comProblema} ${plural} de revisão.`);
console.log('[revisar] nada foi alterado: a correção é decisão da mestra.');
process.exit(0);
