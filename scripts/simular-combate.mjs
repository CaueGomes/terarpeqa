/* Simulador de combate da mesa.
   ---------------------------------------------------------------------------
   Para quando não há seis jogadores à mão: monta um personagem de cada classe
   e subdivisão lendo os catálogos do próprio src/App.jsx, e roda milhares de
   combates contra os inimigos prontos. Responde três perguntas:

     1. Está fácil?    → rodadas até acabar e quantas vezes o grupo cai.
     2. Alguém sobra?  → dano por rodada de cada classe, lado a lado.
     3. O que não dá para usar? → habilidades cujo texto não diz um número.

   O simulador NÃO lê a ficha de ninguém: ele monta personagens de catálogo,
   como um jogador faria na criação. Serve para medir as regras, não a mesa.

   Uso (PowerShell ou Bash, nada para instalar):
     node scripts/simular-combate.mjs
     node scripts/simular-combate.mjs --niveis 1,5,10 --rodadas 3000

   As decisões de modelagem estão em MODELO, mais abaixo, e toda conta que o
   simulador faz é a mesma do App.jsx. Onde ele tem de chutar (qual arma o
   jogador pega, onde põe os pontos), o chute está escrito e é o mesmo para
   todas as classes — senão a comparação não valeria nada. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTE = path.join(RAIZ, 'src', 'App.jsx');

/* ===========================================================================
   1. Ler os catálogos de dentro do JSX
   =========================================================================== */

const txt = fs.readFileSync(FONTE, 'utf8');

/* Recorta o literal depois de "const NOME = " contando delimitadores, mas
   pulando strings e comentários: uma chave dentro de um texto quebraria tudo. */
function literal(nome) {
  const marca = `const ${nome} = `;
  const ini = txt.indexOf(marca);
  if (ini < 0) throw new Error(`não achei ${nome} em ${FONTE}`);
  let i = ini + marca.length;
  const abre = txt[i];
  const fecha = abre === '[' ? ']' : '}';
  let nivel = 0, dentro = null, escapou = false, comentario = null;
  for (; i < txt.length; i++) {
    const c = txt[i], prox = txt[i + 1];
    if (comentario) {
      if (comentario === 'linha' && c === '\n') comentario = null;
      else if (comentario === 'bloco' && c === '*' && prox === '/') { comentario = null; i++; }
      continue;
    }
    if (dentro) {
      if (escapou) { escapou = false; continue; }
      if (c === '\\') { escapou = true; continue; }
      if (c === dentro) dentro = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { dentro = c; continue; }
    if (c === '/' && prox === '/') { comentario = 'linha'; i++; continue; }
    if (c === '/' && prox === '*') { comentario = 'bloco'; i++; continue; }
    if (c === abre) nivel++;
    else if (c === fecha) { nivel--; if (nivel === 0) return txt.slice(ini + marca.length, i + 1); }
  }
  throw new Error(`o literal de ${nome} não fecha`);
}
const ler = (nome) => eval(`(${literal(nome)})`);
const num = (nome) => {
  const m = txt.match(new RegExp(`(?:const\\s+|,\\s*)${nome} = (-?\\d+(?:\\.\\d+)?)`));
  if (!m) throw new Error(`não achei a constante ${nome}`);
  return Number(m[1]);
};

const BALANCO_CLASSE = ler('BALANCO_CLASSE');
const BALANCO_SUBDIVISAO = ler('BALANCO_SUBDIVISAO');
const BALANCO_PADRAO = ler('BALANCO_PADRAO');
const PERICIAS = ler('PERICIAS');
const TIERS = ler('TIERS');
const ARMAS = ler('ARMAS_CATALOGO');
const ARMADURAS = ler('ARMADURAS_CATALOGO');
const HABILIDADES = ler('HABILIDADES_CATALOGO');
const FEITICOS = ler('FEITICOS_CATALOGO');
const INIMIGOS = ler('INIMIGOS_PRONTOS');
const CATEGORIAS = ler('CATEGORIAS_INIMIGO');
const AUTOMATICAS = ler('HABILIDADES_AUTOMATICAS');
const PERICIAS_POR_CLASSE = ler('PERICIAS_POR_CLASSE');
const FAIXAS_DE_TREINO = ler('FAIXAS_DE_TREINO');
const GANHO_ATRIBUTO = ler('GANHO_ATRIBUTO_POR_NIVEL');
const PODERES_POR_NIVEL = ler('PODERES_POR_NIVEL');
const TIPOS_AGUA = ler('TIPOS_AGUA');
const FAMILIAS_GUERREIRO = ler('FAMILIAS_GUERREIRO');
const REPUTACOES_PIRATA = ler('REPUTACOES_PIRATA');
const CORTE_NASCIDO_OURO = ler('CORTE_NASCIDO_OURO');
const TIPOS_ANIMAL = ler('TIPOS_ANIMAL');

const C = {
  ganhoPorAtributo: num('GANHO_POR_ATRIBUTO'),
  defesaPiso: num('DEFESA_PISO'),
  baseEsquiva: num('BASE_ESQUIVA'),
  multBloqueio: num('MULTIPLICADOR_BLOQUEIO'),
  multMotoras: num('MULTIPLICADOR_MOTORAS_DEFESA'),
  critico: num('CRITICO_MINIMO'),
  degrauDanoMagico: num('DEGRAU_DANO_MAGICO'),
  iraBase: num('IRA_BASE'),
  iraPorAtributo: num('IRA_POR_ATRIBUTO'),
  habilidadesNaReserva: num('HABILIDADES_NA_RESERVA'),
  usosPorCena: num('USOS_DE_HABILIDADE_POR_CENA'),
  pontosIniciais: num('PONTOS_ATRIBUTO_INICIAIS'),
  attrMax: num('ATTR_MAX'),
};

const SUBDIVISOES = [...TIPOS_AGUA, ...FAMILIAS_GUERREIRO, ...REPUTACOES_PIRATA, ...CORTE_NASCIDO_OURO, ...TIPOS_ANIMAL];
const periciaPorNome = new Map(PERICIAS.map((p) => [p.nome.toLowerCase(), p]));
const periciaPorId = new Map(PERICIAS.map((p) => [p.id, p]));

/* ===========================================================================
   2. As contas do jogo — as mesmas do App.jsx
   =========================================================================== */

const RE_CUSTO_SANIDADE = /gasta\s+(?:(\d{1,2})\s*d\s*(\d{1,3})|(\d{1,3}))\s+de\s+sanidade/gi;
function custoSanidade(texto) {
  let maior = 0;
  for (const m of String(texto || '').matchAll(RE_CUSTO_SANIDADE)) {
    const custo = m[1] ? (Number(m[1]) * (Number(m[2]) + 1)) / 2 : Number(m[3]);
    if (custo > maior) maior = custo;
  }
  return maior;
}
/* O custo de mana vem escrito de duas formas no catálogo: "gasta 8 de mana" e
   "1d12 de dano por 3 de mana". A segunda é a dos feitiços que escalam. */
const custoMana = (t) => Number(String(t || '').match(/(?:gasta|custa|por)\s+(\d{1,3})\s+de\s+mana/i)?.[1]) || 0;
const ganhoDeIra = (t) => Number(String(t || '').match(/acumula\s+(\d{1,3})\s+de\s+ira/i)?.[1]) || 0;
function custoDeVida(texto) {
  const m = String(texto || '').match(/custa\s+(\d{1,3})\s+de\s+vida(\s+permanente)?/i);
  return m ? { valor: Number(m[1]), permanente: !!m[2] } : null;
}
function lerNotacao(texto) {
  const m = String(texto || '').match(/(\d{1,2})\s*d\s*(\d{1,3})\s*(?:([+-])\s*(\d{1,3}))?/i);
  if (!m) return null;
  const qtd = Number(m[1]), faces = Number(m[2]);
  if (!qtd || !faces) return null;
  const mod = m[3] ? (m[3] === '-' ? -Number(m[4]) : Number(m[4])) : 0;
  return { qtd, faces, mod };
}
const mediaDado = (n) => (n ? n.qtd * (n.faces + 1) / 2 + n.mod : 0);

const grauMaximoDoNivel = (nivel) =>
  FAIXAS_DE_TREINO.reduce((maior, f) => (nivel >= f.doNivel ? f.grauMaximo : maior), 0);

const pontosDeAtributo = (nivel) => {
  let p = C.pontosIniciais;
  for (let n = 2; n <= nivel; n++) p += GANHO_ATRIBUTO[n] || 0;
  return p;
};
const degrausDePericia = (nivel) => 4 + 2 * (nivel - 1);
const vagasDeHabilidade = (nivel) => 2 + Math.floor((nivel - 1) / 2);

/* ===========================================================================
   3. MODELO — onde o simulador precisa decidir pelo jogador
   =========================================================================== */

const MODELO = {
  arma: 'a de maior dano médio entre as da classe/subdivisão e as gerais',
  atributos: 'metade dos pontos no atributo da arma (teto 5), resto em Físico e Motoras alternando',
  pericias: 'a perícia da arma primeiro, depois Velocidade de reação (Esquiva) e Resistência (Bloqueio), tudo no teto do nível',
  habilidades: 'as vagas vão para as habilidades da classe que têm dano escrito; as demais o simulador não sabe usar',
  reacao: 'uma por rodada: Esquiva se ela for maior que a Defesa, senão Bloqueio',
  foco: 'os jogadores batem todos no mesmo inimigo; o inimigo sorteia o alvo entre os de pé',
  caido: 'a 0 de vida o personagem sai do combate e não volta (ninguém cura no simulador)',
  teto: '50 rodadas; passou disso, conta como combate que não acaba',
};

/* Experimento: o feitiço somar o atributo no dano, como a arma já faz. Com
   --feitico-com-atributo o simulador mede a regra antes de ela existir. */
const SOMA_ATRIBUTO_NO_FEITICO = process.argv.includes('--feitico-com-atributo');

const d = (faces) => 1 + Math.floor(Math.random() * faces);
const rolar = (n) => {
  if (!n) return 0;
  let s = n.mod;
  for (let i = 0; i < n.qtd; i++) s += d(n.faces);
  return s;
};
const maximo = (n) => (n ? n.qtd * n.faces + n.mod : 0);

/* ===========================================================================
   4. Montar um personagem de catálogo
   =========================================================================== */

const classeDaSub = (subId) => {
  if (TIPOS_AGUA.some((x) => x.id === subId)) return 'sereia';
  if (FAMILIAS_GUERREIRO.some((x) => x.id === subId)) return 'guerreiro';
  if (REPUTACOES_PIRATA.some((x) => x.id === subId)) return 'pirata';
  if (CORTE_NASCIDO_OURO.some((x) => x.id === subId)) return 'nascido_ouro';
  if (TIPOS_ANIMAL.some((x) => x.id === subId)) return 'druida';
  return null;
};

/* Todas as combinações jogáveis: o mago não tem subdivisão de corpo, a dele é
   o nível mágico, então entra uma vez só. */
function combinacoes() {
  const out = [];
  for (const sub of SUBDIVISOES) {
    const classe = classeDaSub(sub.id);
    if (classe) out.push({ classe, subId: sub.id, nome: sub.nome });
  }
  out.push({ classe: 'mago', subId: null, nome: 'Mago' });
  return out;
}

function armasDisponiveis(classe, subId) {
  return ARMAS.filter((a) => {
    if (a.classe && a.classe !== classe) return false;
    if (a.subdivisaoId && a.subdivisaoId !== subId) return false;
    return !!lerNotacao(a.dano);
  });
}

/* Sem --nivel-magico, o mago simulado tem o máximo que o nível dele permite:
   é o caso típico da mesa, e é o que o teto por nível passou a garantir. */
const NIVEL_MAGICO = (() => {
  const i = process.argv.indexOf('--nivel-magico');
  return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 100;
})();
/* O mesmo teto do App.jsx: dez de nível mágico por nível de classe. */
const NIVEL_MAGICO_POR_NIVEL = num('NIVEL_MAGICO_POR_NIVEL');
const NIVEL_MAX_MAGICO = num('NIVEL_MAX');
const tetoDoNivelMagico = (nivelClasse) =>
  Math.min(NIVEL_MAX_MAGICO, Math.max(5, nivelClasse * NIVEL_MAGICO_POR_NIVEL));

function montar(classe, subId, nivel, nivelMagico = Math.min(NIVEL_MAGICO, tetoDoNivelMagico(nivel))) {
  const base = BALANCO_CLASSE[classe];
  const sub = subId ? BALANCO_SUBDIVISAO[subId] : null;

  /* --- a arma, e com ela o atributo que importa --- */
  const arma = armasDisponiveis(classe, subId)
    .sort((a, b) => mediaDado(lerNotacao(b.dano)) - mediaDado(lerNotacao(a.dano)))[0];
  const periciaArma = periciaPorNome.get(String(arma?.teste || '').toLowerCase());
  /* O mago ataca com feitiço, e feitiço é Dicionário mental (Intelecto). A arma
     dele é Savoir-faire, que é MOTORAS: investir na arma deixa o feitiço sem
     atributo nenhum. Quem manda no perfil é a ação que ele usa de verdade. */
  const periciaDeAtaque = classe === 'mago'
    ? periciaPorId.get('dicionario_mental')
    : periciaArma;
  const attrArma = periciaArma?.atributo || 'fisico';
  const attrAtaque = periciaDeAtaque?.atributo || attrArma;

  /* --- atributos --- */
  const attrs = { intelecto: 0, psique: 0, fisico: 0, motoras: 0 };
  const fila = [attrAtaque, 'fisico', attrAtaque, 'motoras'];
  let restam = pontosDeAtributo(nivel), i = 0, tentativas = 0;
  while (restam > 0 && tentativas < 200) {
    const alvo = fila[i % fila.length];
    i++; tentativas++;
    if (attrs[alvo] >= C.attrMax) continue;
    attrs[alvo]++; restam--;
  }

  /* --- perícias --- */
  const concedidas = new Set(PERICIAS_POR_CLASSE[classe] || []);
  (SUBDIVISOES.find((s) => s.id === subId)?.pericias || []).forEach((p) => concedidas.add(p));
  const teto = grauMaximoDoNivel(nivel);
  const pericias = {};
  concedidas.forEach((p) => { pericias[p] = Math.min(1, teto); });
  let degraus = degrausDePericia(nivel);
  /* O mago ataca com feitiço, e TODO feitiço é lançado com Dicionário mental:
     é essa que ele treina primeiro, não a da arma que ele quase não saca. */
  const prioridade = [periciaDeAtaque?.id, periciaArma?.id, 'velocidade_reacao', 'resistencia']
    .filter((x, i, a) => x && a.indexOf(x) === i);
  for (const pid of prioridade) {
    while (degraus > 0 && (pericias[pid] || 0) < teto) { pericias[pid] = (pericias[pid] || 0) + 1; degraus--; }
  }

  const grau = (pid) => Math.min(pericias[pid] || 0, teto);
  const bonusPericia = (pid) => TIERS[grau(pid)].bonus;
  const modTeste = (pid) => {
    const p = periciaPorId.get(pid);
    return bonusPericia(pid) + (p ? attrs[p.atributo] : 0);
  };

  /* --- armadura: a de maior defesa que a classe pode usar --- */
  const armadura = ARMADURAS
    .filter((a) => (!a.classe || a.classe === classe) && (!a.subdivisaoId || a.subdivisaoId === subId))
    .sort((a, b) => (b.defesa || 0) - (a.defesa || 0))[0];
  const equipamento = armadura?.defesa || 0;

  /* --- habilidades: as que têm dano escrito, até as vagas --- */
  const doCatalogo = HABILIDADES.filter((h) =>
    (!h.classe || h.classe === classe) && (!h.subdivisaoId || h.subdivisaoId === subId));
  const automaticas = (AUTOMATICAS[classe] || []).length;
  const comDano = doCatalogo
    .map((h) => ({ h, dado: lerNotacao(h.descricao), custo: custoSanidade(h.descricao) }))
    .filter((x) => x.dado && /dano|causa|atinge|golpe/i.test(x.h.descricao))
    .sort((a, b) => mediaDado(b.dado) - mediaDado(a.dado));
  const escolhidas = comDano.slice(0, vagasDeHabilidade(nivel));

  /* --- feitiços: só o mago, e só os de dano --- */
  const feiticos = classe === 'mago'
    ? FEITICOS
        .filter((f) => (f.nivelMin || 5) <= nivelMagico && lerNotacao(f.descricao) && /dano/i.test(f.descricao))
        .map((f) => ({ f, dado: lerNotacao(f.descricao), escala: !!f.escala }))
        .sort((a, b) => mediaDado(b.dado) - mediaDado(a.dado))
        .slice(0, 2 + Math.floor(nivelMagico / 10))
    : [];

  /* --- poderes de classe (ira / contratos) --- */
  const poderes = (PODERES_POR_NIVEL[classe] || [])
    .filter((p) => p.nivel <= nivel)
    .map((p) => ({ ...p, ira: ganhoDeIra(p.descricao), vida: custoDeVida(p.descricao), dado: lerNotacao(p.descricao) }));

  /* --- recursos --- */
  const custosOrdenados = doCatalogo.map((h) => custoSanidade(h.descricao)).filter((c) => c > 0)
    .sort((a, b) => b - a).slice(0, C.habilidadesNaReserva);
  const reserva = custosOrdenados.length
    ? Math.round(custosOrdenados.reduce((s, c) => s + c, 0) / custosOrdenados.length * C.usosPorCena)
    : 0;
  const magico = classe === 'mago' ? nivelMagico : 0;
  const ganhoMagico = classe === 'mago' ? Math.floor(nivelMagico / 10) : 0;

  const vida = base.vidaBase + base.vidaPorNivel * (nivel - 1) + (sub?.vida || 0)
    + attrs.fisico * C.ganhoPorAtributo + ganhoMagico;
  const sanidade = base.sanBase + reserva + base.sanPorNivel * (nivel - 1) + (sub?.sanidade || 0)
    + attrs.psique * C.ganhoPorAtributo + ganhoMagico;

  const defesa = base.defesaBase + (sub?.defesa || 0) + attrs.motoras * C.multMotoras + equipamento;
  const bloqueio = bonusPericia('resistencia') * C.multBloqueio;
  const esquiva = C.baseEsquiva + attrs.motoras + bonusPericia('velocidade_reacao');

  return {
    classe, subId, nivel, nome: `${classe}/${subId || '—'}`,
    attrs, pericias, teto, arma, periciaArma, attrArma, armadura,
    habilidades: escolhidas, feiticos, poderes,
    semNumero: doCatalogo.length - comDano.length, totalHabilidades: doCatalogo.length, automaticas,
    vidaMax: vida, sanidadeMax: sanidade, manaMax: magico, iraMax:
      classe === 'guerreiro' ? C.iraBase + C.iraPorAtributo * (attrs.fisico + attrs.psique) : 0,
    defesa, bloqueio, esquiva, bonusArma: Math.floor(nivel / 2), bonusMagico: ganhoMagico,
    modTeste, bonusPericia,
  };
}

/* ===========================================================================
   5. O combate
   =========================================================================== */

function novoLutador(ficha) {
  return {
    f: ficha, vida: ficha.vidaMax, sanidade: ficha.sanidadeMax, mana: ficha.manaMax,
    ira: 0, critico: false, reacaoUsada: false, dano: 0, turnosSemRecurso: 0,
  };
}

/* Com --acoes N o simulador ignora a categoria e dá N ações a todo inimigo:
   é como se mede quanto de pressão falta antes de escrever o número no
   catálogo. Sem a flag, vale o que está no catálogo. */
const forcarAcoes = (() => {
  const i = process.argv.indexOf('--acoes');
  return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : null;
})();
/* --escala-vida 1.5 multiplica a vida de todo boss à mão. Sem ela, vale a
   escala de encontro do catálogo para o tamanho do grupo simulado. */
const escalaVidaManual = (() => {
  const i = process.argv.indexOf('--escala-vida');
  return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : null;
})();
/* Quantos jogadores na mesa. O grupo simulado é um de cada classe: seis. */
const JOGADORES = (() => {
  const i = process.argv.indexOf('--jogadores');
  return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 6;
})();

/* A mesma regra do App.jsx, lida de lá para não divergir. */
const JOGADORES_BASE = num('JOGADORES_BASE');
const VIDA_POR_JOGADOR_EXTRA = num('VIDA_POR_JOGADOR_EXTRA');
const JOGADORES_POR_ACAO_EXTRA = num('JOGADORES_POR_ACAO_EXTRA');
function escalaDeEncontro(categoriaId, jogadores) {
  const extras = Math.max(0, (Number(jogadores) || JOGADORES_BASE) - JOGADORES_BASE);
  const base = CATEGORIAS.find((c) => c.id === categoriaId)?.acoes || 1;
  if (categoriaId === 'npc') return { vida: 1, acoes: base };
  return {
    vida: 1 + VIDA_POR_JOGADOR_EXTRA * extras,
    acoes: base + Math.floor(extras / JOGADORES_POR_ACAO_EXTRA),
  };
}

/* A chance de acertar uma DT típica de jogador no nível alto. Só serve para o
   inimigo comparar as próprias armas entre si. */
const DT_TIPICA = 20;
const chanceContra = (mod) => Math.min(1, Math.max(0.05, (21 - (DT_TIPICA - mod)) / 20));

function inimigoLutador(modelo) {
  const [intelecto, psique, fisico, motoras] = modelo.attrs;
  const attrs = { intelecto, psique, fisico, motoras };
  const armas = (modelo.armas || [])
    .map(([nome, dano, teste]) => ({ nome, dado: lerNotacao(dano), pericia: periciaPorNome.get(String(teste).toLowerCase()) }))
    .filter((a) => a.dado)
    .sort((a, b) => mediaDado(b.dado) - mediaDado(a.dado));
  const grau = (pid) => modelo.pericias?.[pid] || 0;
  /* Metade do que um boss é está nas habilidades dele, não na arma. Mas só
     entra o que tira VIDA: o 10d10 do Arauto é cura, e a Chuva de marcas tira
     sanidade — tratar os dois como golpe fazia dele o dobro do que é. */
  const golpes = (modelo.habilidades || [])
    .map(([nome, descricao]) => ({ nome, descricao, dado: lerNotacao(descricao), pericia: armas[0]?.pericia }))
    .filter((h) => h.dado && /de dano/i.test(h.descricao)
      && !/sanidade|cura|recupera|de volta/i.test(h.descricao));
  const escala = escalaDeEncontro(modelo.cat, JOGADORES);
  const vida = Math.round(modelo.vida * (escalaVidaManual ?? escala.vida));
  const mod = (a) => (a.pericia ? TIERS[grau(a.pericia.id)].bonus + attrs[a.pericia.atributo] : 0);
  /* Pelo dano ESPERADO, não pelo dado maior: de nada adianta o inimigo sacar a
     arma de 3d10 se a perícia dela não está treinada e ele erra o tempo todo. */
  const melhorGolpe = [...armas, ...golpes]
    .sort((a, b) => mediaDado(b.dado) * chanceContra(mod(b)) - mediaDado(a.dado) * chanceContra(mod(a)))[0];
  return {
    modelo, attrs, armas, golpes, melhorGolpe, vida, vidaMax: vida,
    /* Quantas vezes age por rodada: é o que equilibra uma mesa inteira contra
       um inimigo só. Vem da categoria, escalada pelo tamanho do grupo. */
    acoes: forcarAcoes ?? escala.acoes,
    defesa: modelo.defesa,
    esquiva: C.baseEsquiva + motoras + TIERS[grau('velocidade_reacao')].bonus,
    bloqueio: TIERS[grau('resistencia')].bonus * C.multBloqueio,
    mod,
  };
}

/* Um ataque: 1d20 + atributo + treino contra a DT do alvo. A reação do alvo
   escolhe a DT (Esquiva) ou abate o dano (Bloqueio), uma vez por rodada. */
function atacar({ mod, dado, bonusDano, critico }, alvo, usaReacao) {
  const bruto = d(20);
  let dt = alvo.defesa;
  let abate = 0;
  if (usaReacao) {
    if (alvo.esquiva > alvo.defesa) dt = alvo.esquiva;
    else abate = alvo.bloqueio;
  }
  const acertou = bruto + mod >= dt;
  if (!acertou) return { acertou: false, dano: 0, critico: bruto >= C.critico };
  const base = critico ? maximo(dado) : rolar(dado);
  return { acertou: true, dano: Math.max(0, base + bonusDano - abate), critico: bruto >= C.critico };
}

/* A escolha do turno: a ação de maior dano médio que ainda dá para pagar. */
function melhorAcao(l) {
  const f = l.f;
  const opcoes = [];
  if (f.arma) {
    opcoes.push({
      tipo: 'arma', nome: f.arma.nome, dado: lerNotacao(f.arma.dano),
      mod: f.modTeste(f.periciaArma?.id || 'instrumento_fisico'),
      bonusDano: f.attrs[f.attrArma] + f.bonusArma, custoSan: 0, custoMana: 0, comCritico: true,
    });
  }
  for (const h of f.habilidades) {
    if (h.custo > l.sanidade) continue;
    opcoes.push({
      tipo: 'habilidade', nome: h.h.nome, dado: h.dado,
      mod: f.modTeste(f.periciaArma?.id || 'instrumento_fisico'),
      bonusDano: 0, custoSan: h.custo, custoMana: 0, comCritico: false,
    });
  }
  for (const fe of f.feiticos) {
    const cm = custoMana(fe.f.descricao);
    if (cm > l.mana) continue;
    opcoes.push({
      tipo: 'feitico', nome: fe.f.nome, dado: fe.dado,
      mod: f.modTeste('dicionario_mental'),
      bonusDano: fe.escala ? f.bonusMagico + (SOMA_ATRIBUTO_NO_FEITICO ? f.attrs.intelecto : 0) : 0,
      custoSan: 0, custoMana: cm, comCritico: false,
    });
  }
  if (!opcoes.length) return null;
  return opcoes.sort((a, b) => (mediaDado(b.dado) + b.bonusDano) - (mediaDado(a.dado) + a.bonusDano))[0];
}

/* Um combate: o grupo contra uma lista de inimigos (um boss, ou um bando).
   Todo mundo age uma vez por rodada, que é o que o sistema permite. */
function combate(fichas, modelos, tetoRodadas = 50) {
  const grupo = fichas.map(novoLutador);
  const inimigos = modelos.map(inimigoLutador);
  let rodada = 0, danoSofrido = 0;

  const vivos = () => inimigos.filter((i) => i.vida > 0);
  const dePe = () => grupo.filter((l) => l.vida > 0);

  while (rodada < tetoRodadas) {
    rodada++;
    grupo.forEach((l) => { l.reacaoUsada = false; });
    inimigos.forEach((i) => { i.reacaoUsada = false; });

    /* --- os jogadores, todos no mesmo alvo --- */
    for (const l of grupo) {
      if (l.vida <= 0) continue;
      const alvo = vivos()[0];
      if (!alvo) break;
      const acao = melhorAcao(l);
      if (!acao) { l.turnosSemRecurso++; continue; }
      l.sanidade -= acao.custoSan;
      l.mana -= acao.custoMana;
      /* Uma reação por rodada também para o inimigo: ele gasta a dele no
         primeiro golpe que recebe, não nos seis. */
      const reage = !alvo.reacaoUsada;
      alvo.reacaoUsada = true;
      const r = atacar({ ...acao, critico: l.critico && acao.comCritico }, alvo, reage);
      if (l.critico && acao.comCritico) l.critico = false;
      if (acao.comCritico && r.critico) l.critico = true;
      alvo.vida -= r.dano;
      l.dano += r.dano;
    }
    if (!vivos().length) {
      return { venceu: true, rodadas: rodada, caidos: grupo.filter((x) => x.vida <= 0).length, grupo, danoSofrido };
    }

    /* --- os inimigos: cada um age o número de vezes da ficha dele --- */
    for (const inim of vivos()) {
      const golpe = inim.melhorGolpe;
      if (!golpe) continue;
      for (let acao = 0; acao < inim.acoes; acao++) {
        const alvos = dePe();
        if (!alvos.length) break;
        const alvo = alvos[Math.floor(Math.random() * alvos.length)];
        const usaReacao = !alvo.reacaoUsada;
        alvo.reacaoUsada = true;
        const r = atacar(
          { mod: inim.mod(golpe), dado: golpe.dado, bonusDano: inim.attrs[golpe.pericia?.atributo] || 0, critico: false },
          { defesa: alvo.f.defesa, esquiva: alvo.f.esquiva, bloqueio: alvo.f.bloqueio }, usaReacao);
        alvo.vida -= r.dano;
        danoSofrido += r.dano;
      }
    }
    if (!dePe().length) return { venceu: false, rodadas: rodada, caidos: grupo.length, grupo, danoSofrido };
  }
  return { venceu: false, rodadas: tetoRodadas, caidos: grupo.filter((l) => l.vida <= 0).length, grupo, danoSofrido, estourou: true };
}

/* ===========================================================================
   6. Medidas
   =========================================================================== */

const mediana = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x) => `${(x * 100).toFixed(0)}%`;
const n1 = (x) => x.toFixed(1);

/* O dano por rodada de uma ficha sozinha, contra uma Defesa dada. Mede a
   classe, não o grupo: é o número que diz quem bate e quem assiste. */
function dprContra(ficha, defesa, rodadas = 4000) {
  const l = novoLutador(ficha);
  let total = 0;
  for (let i = 0; i < rodadas; i++) {
    l.sanidade = ficha.sanidadeMax; l.mana = ficha.manaMax; l.critico = false;
    const acao = melhorAcao(l);
    if (!acao) continue;
    const r = atacar({ ...acao, critico: false }, { defesa, esquiva: 0, bloqueio: 0 }, false);
    total += r.dano;
  }
  return total / rodadas;
}

/* ===========================================================================
   7. Auto-teste: as contas batem com o que a ficha mostra na tela?
   =========================================================================== */

function autoTeste() {
  /* Nascido de ouro, Bobo da Corte, nível 6, INT 1 PSI 3 FIS 2 MOT 1.
     A tela mostra Vida 62, Sanidade 105, Defesa 12, Bloqueio 0, Esquiva 11
     (conferido no navegador em 19/10/2026, sem armadura equipada). */
  const b = BALANCO_CLASSE.nascido_ouro, s = BALANCO_SUBDIVISAO.bobo_corte;
  const vida = b.vidaBase + b.vidaPorNivel * 5 + s.vida + 2 * C.ganhoPorAtributo;
  const defesa = b.defesaBase + s.defesa + 1 * C.multMotoras;
  const esquiva = C.baseEsquiva + 1 + 0;
  const erros = [];
  if (vida !== 62) erros.push(`vida ${vida}, esperado 62`);
  if (defesa !== 12) erros.push(`defesa ${defesa}, esperado 12`);
  if (esquiva !== 11) erros.push(`esquiva ${esquiva}, esperado 11`);
  /* O parser de dado e de custo precisa achar o que está escrito. */
  if (mediaDado(lerNotacao('3d10')) !== 16.5) erros.push('lerNotacao 3d10');
  if (custoSanidade('Gasta 12 de sanidade a cada ordem.') !== 12) erros.push('custoSanidade');
  if (custoSanidade('Recupera 3d10 de sanidade.') !== 0) erros.push('custoSanidade pegou uma recuperação');
  if (erros.length) { console.error('AUTO-TESTE FALHOU:\n  ' + erros.join('\n  ')); process.exit(1); }
}

/* ===========================================================================
   8. Relatório
   =========================================================================== */

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

function principal() {
  autoTeste();
  const niveis = arg('niveis', '1,3,5,7,10').split(',').map(Number);
  const repeticoes = Number(arg('rodadas', '2000'));
  const combos = combinacoes();

  console.log('='.repeat(78));
  console.log('SIMULAÇÃO DE COMBATE — Terarpeqá');
  console.log(`${combos.length} combinações de classe e subdivisão · ${repeticoes} combates por cenário`);
  console.log('='.repeat(78));

  /* ---- 1. dano por rodada, classe a classe ---- */
  for (const nivel of niveis) {
    console.log(`\n\n### DANO POR RODADA — nível ${nivel}`);
    console.log('(contra Defesa 14, que é a de um inimigo médio; inclui a chance de errar)\n');
    const linhas = combos.map((c) => {
      const f = montar(c.classe, c.subId, nivel);
      const l = novoLutador(f);
      const acao = melhorAcao(l);
      return {
        nome: `${c.classe} / ${c.nome}`,
        dpr: dprContra(f, 14),
        acao: acao ? `${acao.nome} (${acao.dado.qtd}d${acao.dado.faces}${acao.bonusDano ? `+${acao.bonusDano}` : ''})` : '—',
        acerto: acao ? Math.min(1, Math.max(0, (21 - (14 - acao.mod)) / 20)) : 0,
        vida: f.vidaMax, defesa: f.defesa, esquiva: f.esquiva,
      };
    }).sort((a, b) => b.dpr - a.dpr);
    const larg = Math.max(...linhas.map((l) => l.nome.length));
    for (const l of linhas) {
      console.log(`${l.nome.padEnd(larg)}  ${n1(l.dpr).padStart(5)} dano/rodada  ·  acerta ${pct(l.acerto).padStart(4)}  ·  vida ${String(l.vida).padStart(3)}  def ${l.defesa}/esq ${l.esquiva}  ·  ${l.acao}`);
    }
    const ds = linhas.map((l) => l.dpr);
    console.log(`\n  maior ÷ menor = ${n1(Math.max(...ds) / Math.min(...ds))}×   (até 2× é uma mesa onde todo mundo contribui)`);
  }

  /* ---- 2. o grupo de seis contra cada inimigo ---- */
  console.log('\n\n### O GRUPO DE SEIS CONTRA OS INIMIGOS PRONTOS');
  console.log('Um de cada classe, a subdivisão de maior dano, no nível que a categoria assume.\n');

  const nivelDaCategoria = {};
  for (const cat of CATEGORIAS) {
    const m = String(cat.frase || '').match(/n[íi]vel\s+(\d{1,2})/i);
    nivelDaCategoria[cat.id] = m ? Number(m[1]) : 5;
  }

  for (const cat of CATEGORIAS) {
    const nivel = nivelDaCategoria[cat.id];
    /* um por classe: a subdivisão que mais bate naquele nível */
    const porClasse = new Map();
    for (const c of combos) {
      const f = montar(c.classe, c.subId, nivel);
      const atual = porClasse.get(c.classe);
      const dpr = dprContra(f, 14, 1500);
      if (!atual || dpr > atual.dpr) porClasse.set(c.classe, { f, dpr, nome: c.nome });
    }
    const grupo = [...porClasse.values()].map((x) => x.f);
    const vidaDoGrupo = grupo.reduce((s, f) => s + f.vidaMax, 0);

    console.log(`\n${cat.nome.toUpperCase()} — grupo de nível ${nivel}  (vida somada ${vidaDoGrupo})`);
    console.log(`  ${[...porClasse.entries()].map(([k, v]) => `${k}:${v.nome}`).join('  ')}`);

    /* Sozinho e com escolta: um NPC vem em bando, um boss raramente vem só. */
    const cenarios = cat.id === 'npc'
      ? [{ rotulo: 'em bando de 4', n: 4 }]
      : [{ rotulo: 'sozinho', n: 1 }, { rotulo: '+ 2 NPCs', n: 1, escolta: 2 }];

    for (const modelo of INIMIGOS.filter((i) => i.cat === cat.id)) {
      for (const cen of cenarios) {
        const lista = Array.from({ length: cen.n }, () => modelo);
        if (cen.escolta) {
          const npcs = INIMIGOS.filter((i) => i.cat === 'npc');
          for (let k = 0; k < cen.escolta; k++) lista.push(npcs[k % npcs.length]);
        }
        const res = [];
        for (let i = 0; i < repeticoes; i++) res.push(combate(grupo, lista));
        const venceu = res.filter((r) => r.venceu);
        const rod = mediana(venceu.map((r) => r.rodadas)) || 0;
        const perdeu = 1 - venceu.length / res.length;
        const caidos = media(res.map((r) => r.caidos));
        const sofrido = media(res.map((r) => r.danoSofrido));
        const aviso = perdeu > 0.25 ? '  <- perigoso'
          : rod > 12 ? '  <- longo demais'
          : caidos < 0.5 && rod < 4 ? '  <- passeio' : '';
        const etiqueta = `${modelo.nome} ${cen.rotulo}`;
        console.log(`  ${etiqueta.padEnd(36)} ${n1(rod).padStart(4)} rodadas · derrota ${pct(perdeu).padStart(4)} · ${n1(caidos)} caídos · grupo perde ${pct(sofrido / vidaDoGrupo).padStart(4)} da vida${aviso}`);
      }
    }
  }

  /* ---- 2b. quem cai, e quanto cada um entrega ---- */
  console.log('\n\n### QUEM CAI E QUEM ENTREGA');
  console.log('Grupo de nível 10 contra cada boss final, 6 jogadores. Mostra se a Defesa baixa');
  console.log('de uma subdivisão a transforma em alvo de verdade ou só no papel.\n');
  {
    const nivel = 10;
    const porClasse = new Map();
    for (const c of combos) {
      const f = montar(c.classe, c.subId, nivel);
      const dpr = dprContra(f, 14, 1500);
      const atual = porClasse.get(c.classe);
      if (!atual || dpr > atual.dpr) porClasse.set(c.classe, { f, dpr, nome: c.nome });
    }
    const grupo = [...porClasse.values()].map((x) => x.f);
    const finais = INIMIGOS.filter((i) => i.cat === 'final');
    const quedas = new Map(), danos = new Map();
    let total = 0;
    for (const modelo of finais) {
      for (let i = 0; i < repeticoes; i++) {
        const r = combate(grupo, [modelo]);
        total++;
        r.grupo.forEach((l) => {
          if (l.vida <= 0) quedas.set(l.f.nome, (quedas.get(l.f.nome) || 0) + 1);
          danos.set(l.f.nome, (danos.get(l.f.nome) || 0) + l.dano);
        });
      }
    }
    const linhas = grupo.map((f) => ({
      nome: f.nome, dt: Math.max(f.defesa, f.esquiva), vida: f.vidaMax,
      queda: (quedas.get(f.nome) || 0) / total, dano: (danos.get(f.nome) || 0) / total,
    })).sort((a, b) => b.queda - a.queda);
    const danoTotal = linhas.reduce((s, l) => s + l.dano, 0);
    for (const l of linhas) {
      console.log(`  ${l.nome.padEnd(22)} DT ${l.dt} · vida ${String(l.vida).padStart(3)} · cai em ${pct(l.queda).padStart(4)} dos combates · entrega ${pct(l.dano / danoTotal).padStart(4)} do dano do grupo`);
    }
  }

  /* ---- 3. a conta das ações: seis contra um ---- */
  console.log('\n\n### A CONTA DAS AÇÕES');
  console.log('Seis jogadores agem seis vezes por rodada; um boss age uma. Esta tabela mostra');
  console.log('o que o inimigo precisaria para o grupo perder METADE da vida antes de vencer.\n');
  for (const cat of CATEGORIAS) {
    const nivel = nivelDaCategoria[cat.id];
    const porClasse = new Map();
    for (const c of combos) {
      const f = montar(c.classe, c.subId, nivel);
      const dpr = dprContra(f, 14, 1500);
      const atual = porClasse.get(c.classe);
      if (!atual || dpr > atual.dpr) porClasse.set(c.classe, { f, dpr });
    }
    const grupo = [...porClasse.values()];
    const vidaGrupo = grupo.reduce((s, x) => s + x.f.vidaMax, 0);
    const danoGrupo = grupo.reduce((s, x) => s + x.dpr, 0);
    for (const modelo of INIMIGOS.filter((i) => i.cat === cat.id)) {
      const inim = inimigoLutador(modelo);
      const golpe = inim.melhorGolpe;
      if (!golpe) continue;
      const defesaMedia = media(grupo.map((x) => Math.max(x.f.defesa, x.f.esquiva)));
      const chance = Math.min(1, Math.max(0, (21 - (defesaMedia - inim.mod(golpe))) / 20));
      const porAcao = (mediaDado(golpe.dado) + (inim.attrs[golpe.pericia?.atributo] || 0)) * chance;
      const rodadas = modelo.vida / danoGrupo;
      const sai = porAcao * rodadas;
      const precisa = (vidaGrupo / 2) / Math.max(0.01, rodadas);
      console.log(`  ${modelo.nome.padEnd(27)} dura ${n1(rodadas).padStart(4)} rodadas · bate ${n1(porAcao).padStart(5)}/rodada (acerta ${pct(chance)}) · leva ${pct(sai / vidaGrupo).padStart(4)} da vida do grupo · precisaria de ${n1(precisa / Math.max(0.01, porAcao)).padStart(4)}× isso`);
    }
  }

  /* ---- 4. a corrida entre acertar e defender, e o fôlego de sanidade ---- */
  console.log('\n\n### ACERTAR E AGUENTAR');
  console.log('A Defesa do grupo contra o ataque do inimigo daquela faixa, e quantas rodadas');
  console.log('a sanidade aguenta se o personagem usar a habilidade mais cara todo turno.\n');
  for (const cat of CATEGORIAS) {
    const nivel = nivelDaCategoria[cat.id];
    const inims = INIMIGOS.filter((i) => i.cat === cat.id).map(inimigoLutador);
    const modInimigo = media(inims.map((i) => {
      const g = i.melhorGolpe;
      return g ? i.mod(g) : 0;
    }));
    console.log(`${cat.nome} — nível ${nivel} (o inimigo ataca com +${n1(modInimigo)})`);
    for (const c of combos) {
      const f = montar(c.classe, c.subId, nivel);
      const dt = Math.max(f.defesa, f.esquiva);
      const chance = Math.min(1, Math.max(0, (21 - (dt - modInimigo)) / 20));
      const doCatalogo = HABILIDADES.filter((h) => (!h.classe || h.classe === c.classe)
        && (!h.subdivisaoId || h.subdivisaoId === c.subId));
      const maisCara = Math.max(0, ...doCatalogo.map((h) => custoSanidade(h.descricao)));
      const folego = maisCara ? f.sanidadeMax / maisCara : Infinity;
      console.log(`  ${`${c.classe}/${c.nome}`.padEnd(34)} DT ${String(dt).padStart(2)} · o inimigo acerta ${pct(chance).padStart(4)} · sanidade ${String(f.sanidadeMax).padStart(3)} aguenta ${folego === Infinity ? '—' : n1(folego)} usos da mais cara (${maisCara})`);
    }
    console.log('');
  }

  /* ---- 5. inimigo com arma que ele não sabe usar ---- */
  console.log('\n\n### ARMA QUE O INIMIGO NÃO SABE USAR');
  console.log('A arma de maior dano da ficha, quando a perícia dela não está treinada:');
  console.log('o dado é grande e o inimigo erra, então a ficha vale menos do que parece.\n');
  let achou = 0;
  for (const modelo of INIMIGOS) {
    const inim = inimigoLutador(modelo);
    if (inim.armas.length < 2) continue;
    const porDado = [...inim.armas].sort((a, b) => mediaDado(b.dado) - mediaDado(a.dado));
    const maior = porDado[0];
    const grau = modelo.pericias?.[maior.pericia?.id] || 0;
    if (grau > 0) continue;
    achou++;
    const outra = porDado.find((a) => (modelo.pericias?.[a.pericia?.id] || 0) > 0);
    console.log(`  ${modelo.nome.padEnd(27)} ${maior.nome} (${maior.dado.qtd}d${maior.dado.faces}) rola +${inim.mod(maior)} em ${maior.pericia?.nome || '—'}, sem treino`
      + (outra ? ` · a treinada é ${outra.nome} (${outra.dado.qtd}d${outra.dado.faces}) +${inim.mod(outra)}` : ''));
  }
  if (!achou) console.log('  nenhum — toda arma de maior dano está treinada.');

  /* ---- 6. o que o simulador não soube usar ---- */
  console.log('\n\n### HABILIDADES SEM NÚMERO NO TEXTO');
  console.log('O simulador só usa o que tem dado escrito. O resto depende da mestra na hora —');
  console.log('o que não é defeito, mas diz quanto de cada classe é conversa e quanto é combate.\n');
  const porClasse = {};
  for (const h of HABILIDADES) {
    const k = h.classe || 'geral';
    porClasse[k] = porClasse[k] || { total: 0, comDado: 0, comCusto: 0 };
    porClasse[k].total++;
    if (lerNotacao(h.descricao)) porClasse[k].comDado++;
    if (custoSanidade(h.descricao)) porClasse[k].comCusto++;
  }
  for (const [k, v] of Object.entries(porClasse).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${k.padEnd(14)} ${String(v.total).padStart(2)} habilidades  ·  ${String(v.comDado).padStart(2)} com dado (${pct(v.comDado / v.total)})  ·  ${String(v.comCusto).padStart(2)} com custo de sanidade (${pct(v.comCusto / v.total)})`);
  }

  console.log('\n\n### COMO O SIMULADOR DECIDE (muda o resultado; leia antes de concluir)');
  for (const [k, v] of Object.entries(MODELO)) console.log(`  ${k.padEnd(12)} ${v}`);
  console.log('');
}

principal();
