import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Crown, Waves, Anchor, BookOpen, Leaf, LogOut, Plus, ChevronRight,
  ChevronLeft, Check, Skull, Trash2, ArrowLeft, Sparkles, Loader2,
  AlertCircle, Swords, Camera, ScrollText, Sliders, Star, Wand2,
  Backpack, Settings, Pencil, Save, X, Info, PawPrint, ChevronDown, Shield, Lock, Flame, Dices,
} from 'lucide-react';

/* ============================================================
   TERARPEQÁ — Protótipo v2
   Login, escolha de classe, herança/subdivisão, perfil, atributos,
   perícias, equipamento e ficha — com conta mestre.
   ============================================================ */

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* Tabela de perícias: no celular o nome ganha espaço e a coluna do atributo some
   (o atributo já aparece no cabeçalho de cada grupo). */
.per-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr) 2.6rem 2.6rem 4rem 3rem;
  column-gap: 0.4rem;
  align-items: center;
}
/* Na ficha salva a última coluna vira o botão de rolar, em vez do campo Outros. */
.per-grid-rolar {
  display: grid;
  grid-template-columns: minmax(0,1fr) 2.6rem 2.6rem 3rem 2.2rem;
  column-gap: 0.4rem;
  align-items: center;
}
.per-nome { line-height: 1.25; }
@media (max-width: 520px) {
  .per-grid { grid-template-columns: minmax(0,1fr) 2.4rem 3.6rem 2.8rem; column-gap: 0.3rem; }
  .per-grid-rolar { grid-template-columns: minmax(0,1fr) 2.6rem 2.8rem 2.2rem; column-gap: 0.3rem; }
  .per-dados { display: none; }
}`;
const F = { display: "'Cinzel', serif", body: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" };

/* ---------- paletas ---------- */
const V = { bg: '#0d0a16', surface: '#161027', surfaceAlt: '#1e1733', border: '#332a52', text: '#f1ecff', muted: '#a89bc9', brand: '#7c5cff' };
const G = { bg: '#0b0b0d', surface: '#17171a', surfaceAlt: '#1e1e22', border: '#2c2c31', text: '#f0f0f2', muted: '#9a9aa2', accent: '#c9c9cf' };

/* ---------- origens jogáveis ---------- */
const ORIGINS = [
  { id: 'druida', nome: 'Druida', deus: 'Melôdia', dominio: 'Terra', cor: '#3E8E5B', corClara: '#9BDCB4', Icon: Leaf,
    frase: 'A natureza te guiará, ouça com atenção.',
    subdivisao: 'animal',
    narrativa: `Bela escolha, druida.

Você é filho(a) de Melôdia, cuja voz acalma a todos ao seu redor e sua bondade faz com que vida cresça em tudo que toca.

Você tem o poder da floresta e dos animais! Como druida, a natureza é sua amiga e guardiã eterna. Evite ficar longe de sua proteção.` },
  { id: 'sereia', nome: 'Sereia / Tritão', deus: 'Ancorê', dominio: 'Água', cor: '#2FB6C4', corClara: '#9FE6EE', Icon: Waves,
    frase: 'Nade junto às ondas, você nasceu aqui.',
    subdivisao: 'tipo',
    narrativa: `Bela escolha, filho(a) das marés.

Você é filho de Ancorê, cuja coragem é o que mais corre sob suas veias. As profundezas do oceano são mais que sua casa: são seu lar. É aqui que você pode lutar de verdade e despertar o melhor de si.

Seu próximo passo é decidir se você será um tritão ou uma sereia!` },
  { id: 'mago', nome: 'Mago', deus: 'Karzaron', dominio: 'Palavra', cor: '#3B6FE0', corClara: '#A8C0F5', Icon: BookOpen,
    frase: 'Acredite no poder que emana em você.',
    subdivisao: 'nivel',
    narrativa: `Bela escolha, mago.

Você é filho(a) de Karzaron, nascido(a) de uma chama de poder que cresceu infinitamente em seu âmago. A sabedoria e a ambição do seu pai correm nas suas veias — e quanto mais poder você conquista, mais escura fica a marca que o denuncia.

Seu próximo passo é declarar seu nível mágico...` },
  { id: 'guerreiro', nome: 'Guerreiro', deus: 'Împera', dominio: 'Luz', cor: '#9B5DE5', corClara: '#D9C3F7', Icon: Swords,
    frase: 'A liberdade custa caro.',
    subdivisao: 'familia',
    narrativa: `Bela escolha... ou talvez não tenha sido escolha nenhuma.

Você é filho(a) de Împera, mas nasceu pra ser marionete, não herdeiro(a). Desde criança, a arena é sua casa e o sangue é sua rotina — tudo isso pra entreter cidadãos e engordar apostas de famílias que sonham em virar ouro.

Você defende os princípios de Împera sem nunca tê-los escolhido pra si.

Seu próximo passo é revelar de qual família você é propriedade...` },
  { id: 'pirata', nome: 'Pirata', deus: 'Ancorê', dominio: 'Água', cor: '#E08A3C', corClara: '#F3C08A', Icon: Anchor,
    frase: 'Siga os ventos, eles te darão respostas.',
    subdivisao: 'reputacao',
    narrativa: `Bela escolha, filho(a) do mar.

Você nasceu de Ancorê, o mesmo pai que deu vida às sereias e tritões — só que você foi feito(a) pro convés, não pra correnteza. Feliz e malicioso(a) como ele, sua lenda te precede em cada porto que você pisa.

Seu próximo passo é escolher que lenda contam sobre você...` },
  { id: 'nascido_ouro', nome: 'Nascido de Ouro', deus: 'Împera', dominio: 'Luz', cor: '#D4AF37', corClara: '#F0DD9A', Icon: Crown,
    frase: 'Não há nada nem ninguém que possa te parar.',
    subdivisao: 'corte',
    narrativa: `Bela escolha, nascido(a) do ouro.

Você é filho(a) de Împera, criado(a) pra governar com a mesma rigidez e autoridade da sua mãe — ou pra desafiar exatamente isso.

É o seu sangue que movimenta o reino, e é sobre os seus ombros que recai o peso de um país inteiro para proteger, entreter, ordenar, conquistar...

Seu próximo passo é descobrir seu lugar na tríade da corte!` },
];

/* Fallback interno para fichas sem classe válida — nunca aparece na seleção. */
const SEM_CLASSE = { id: 'sem_classe', nome: 'Sem classe', deus: '—', dominio: '—', cor: '#6f6291', corClara: '#a89bc9', frase: '' };

/* ---------- fichas da mestra ----------
   Deuses, inimigos e personagens especiais não seguem as mecânicas dos
   jogadores: vida, sanidade e mana começam em 0 e são digitadas na mão, os
   atributos não têm teto, nenhuma perícia vem travada e nenhum catálogo é
   pré-carregado — só os botões de criar. Só a conta mestra pode criá-las,
   e o servidor recusa a gravação de quem não for mestra. */
const TIPOS_MESTRE = [
  { id: 'deus', nome: 'Deus', plural: 'Deuses', cor: '#D4AF37', corClara: '#F0DD9A', Icon: Crown,
    deus: '—', dominio: 'Divino', escolheClasse: false, poderesUnificados: true,
    frase: 'Uma divindade de Terarpeqá. Tudo nesta ficha é definido por você.' },
  { id: 'inimigo', nome: 'Inimigo', plural: 'Inimigos', cor: '#e0577a', corClara: '#f5aabc', Icon: Skull,
    deus: '—', dominio: 'Ameaça', escolheClasse: false, poderesUnificados: false,
    frase: 'Uma ameaça do mundo. Sem classe, sem teto e sem catálogo.' },
  { id: 'especial', nome: 'Especial', plural: 'Especiais', cor: '#7c5cff', corClara: '#c3b3ff', Icon: Sparkles,
    deus: '—', dominio: 'Exceção', escolheClasse: true, poderesUnificados: false,
    frase: 'Segue uma classe do universo, mas nenhuma das regras dela.' },
];
const TIPOS_MESTRE_IDS = TIPOS_MESTRE.map((t) => t.id);
const tipoMestre = (char) => TIPOS_MESTRE.find((t) => t.id === char?.tipoFicha) || null;
/* Ficha livre = sem fórmulas, sem tetos e sem catálogo. */
const fichaLivre = (char) => !!tipoMestre(char);
/* Compartimento do conteúdo criado pela mestra. O que nasce numa ficha de deus
   fica só entre deuses; jogador nunca enxerga nada além do próprio escopo. */
const escopoDaFicha = (char) => char?.tipoFicha || 'jogador';

/* Identidade visual da ficha: a classe escolhida quando existe (o caso do
   especial), senão o próprio tipo de ficha da mestra, senão o vazio. */
function originDaFicha(char) {
  const classe = ORIGINS.find((o) => o.id === char?.originId);
  if (classe) return classe;
  return tipoMestre(char) || SEM_CLASSE;
}

/* ---------- subdivisões ---------- */
const TIPOS_ANIMAL = [
  { id: 'mistico', nome: 'Animal místico', desc: 'Seu uso é muito restrito, e seu laço é complexo, assim como seu ser.' },
  { id: 'natural', nome: 'Animal natural', desc: 'Você não possui restrições quanto ao seu uso, e pode escolher mais de um. Animais naturais exigem menos de seu corpo e mente.' },
];
const NOTA_ANIMAL = 'Escolha seu tipo de animal, e depois diga um animal em específico (em caso de místico) para a mestra, ou, em caso de animal natural, diga quantos e quais animais você quer ter laço. Os bônus deverão ser discutidos e balanceados com base na escolha de seu animal-laço e com base no que a mestra definir.';

const TIPOS_AGUA = [
  { id: 'sereia', nome: 'Sereia', desc: 'Seu canto é como de um deus, pode pegar os desprevenidos no pulo.', pericias: ['compostura', 'volicao'] },
  { id: 'triton', nome: 'Tritão', desc: 'Sua coragem é inabalável, assim como a de seu pai.', pericias: ['instrumento_fisico', 'volicao'] },
];
const NIVEL_MIN = 5, NIVEL_MAX = 100, NIVEL_STEP = 5;

const FAMILIAS_GUERREIRO = [
  { id: 'brutus', nome: 'Brutus', foco: 'Corpo', pericias: ['resistencia', 'furia_sangue'], desc: 'Você é um brutamonte. Nada além do seu corpo entra em uma batalha, e você sabe que isso é o bastante. Você não precisa de armas, nem mesmo pensar no que vai fazer a seguir. Sua força física supera tudo isso.' },
  { id: 'pritzk', nome: 'Pritzk', foco: 'Mente', pericias: ['silencio', 'dicionario_mental'], desc: 'Você é ótimo em se esconder, ótimo em saber exatamente quando atacar. Você usa sua mente porque sabe que nem mesmo o maior dos corpos derruba alguém que fica nas sombras. Você não mata, apenas derruba. É o suficiente. Não é necessário derramar sangue.' },
  { id: 'nerena', nome: 'Nêrena', foco: 'Arma', pericias: ['coordenacao_motora', 'velocidade_reacao'], desc: 'Você é ótimo com armas. Quem precisa de mente ou corpo quando você sabe exatamente qual parte do inimigo é vital? Espadas e arcos são seus favoritos. Você fica perto, mas quando precisa fica longe. Você gosta do sangue sem nem mesmo precisar usar suas mãos.' },
];
const REPUTACOES_PIRATA = [
  { id: 'predileto_mares', nome: 'Predileto dos Mares', foco: 'Corpo', pericias: ['eletroquimica', 'instrumento_fisico'], desc: 'Ancorê uma vez sorriu para você, e desde então você vive por ele. Você é a cópia de seu pai: forte, corajoso e ousado. Você usa a força do seu corpo para abafar suas falhas de personalidade.' },
  { id: 'trapaceiro', nome: 'Trapaceiro', foco: 'Mente', pericias: ['drama', 'compostura'], desc: 'Vivem dizendo que, se você continuar assim, você nunca terá amigos. E quem liga pra isso, afinal? Você é o mestre da enganação, mentir é como uma cicatriz em sua pele. Você já foi um Deus, já viajou para todos os cantos do mundo, é o braço esquerdo de Ancorê… e quem não acredita em você não passa de um tolo.' },
  { id: 'mestre_redemoinhos', nome: 'Mestre dos Redemoinhos', foco: 'Ferramenta', pericias: ['savoir_faire', 'cest_la_vie'], desc: 'Tudo que você faz é pensar, e muitas vezes suas armas te ajudam nessa tarefa. Você talvez não seja o mais musculoso, porém sabe a maneira certa de fazer as coisas (as tarefas úteis que parece que ninguém sabe fazer). Escolha uma ferramenta que maior combina com seu pirata!' },
];
const CORTE_NASCIDO_OURO = [
  { id: 'bobo_corte', nome: 'Bobo da Corte', foco: 'Conquista', pericias: ['imperio_interior', 'cest_la_vie'], desc: 'Você não nasceu para ser um palhaço, mas a frequência com que faz as pessoas gostarem e rirem de você às vezes te faz questionar se você realmente pertence à família real. Afinal, até Împera já riu de suas falas. Você acredita que pessoas precisam ser conquistadas, e não governadas. É como um rebelde, só que menos ofensivo.' },
  { id: 'dono_coroa', nome: 'Dono da Coroa', foco: 'Autoridade', pericias: ['controle_demonios', 'autoridade'], desc: 'Você é quase uma cópia de Împera, talvez um pouco inferior. Nascidos de Prata talvez às vezes te confundam com ela. Sua voz ecoa por todo o país, autoritária e certeira.' },
  { id: 'ensanguentado', nome: 'Ensanguentado', foco: 'Proteção', pericias: ['limiar_dor', 'doenca'], desc: 'Já te disseram que você é um fracasso. Afinal, que membro da família real pega uma arma com suas próprias mãos? Você defende que um país precisa ser protegido, e não governado. Escolha uma arma a seu gosto e lute!' },
];

/* Perícias concedidas pela classe, independente de subdivisão */
const PERICIAS_POR_CLASSE = {
  druida: ['agape'],
  mago: ['savoir_faire', 'dicionario_mental'],
};
/* ---------- níveis de classe ----------
   Todo personagem tem um nível de 1 a 10, independente da classe. Ele governa
   vida, sanidade, mana e quantos pontos de atributo e de perícia o jogador tem
   para distribuir. O mago mantém, além disso, o nível mágico (5 a 100), que
   continua sendo o que libera feitiços e enche a mana. */
const NIVEL_CLASSE_MIN = 1, NIVEL_CLASSE_MAX = 10;
const nivelDaFicha = (char) => clamp(Number(char?.nivel) || NIVEL_CLASSE_MIN, NIVEL_CLASSE_MIN, NIVEL_CLASSE_MAX);

/* Vida e sanidade por classe. Todas partem do mesmo total (58 pontos) e crescem
   o mesmo tanto por nível (9), só que divididos de formas diferentes: quem
   aguenta pancada tem menos cabeça, e vice-versa. Inspirado nos dados de vida
   do D&D, onde o guerreiro sobe d10 e o mago d6. */
const BALANCO_CLASSE = {
  guerreiro:    { vidaBase: 34, vidaPorNivel: 6, sanBase: 24, sanPorNivel: 3 },
  pirata:       { vidaBase: 32, vidaPorNivel: 5, sanBase: 26, sanPorNivel: 4 },
  sereia:       { vidaBase: 30, vidaPorNivel: 5, sanBase: 28, sanPorNivel: 4 },
  druida:       { vidaBase: 28, vidaPorNivel: 4, sanBase: 30, sanPorNivel: 5 },
  nascido_ouro: { vidaBase: 26, vidaPorNivel: 4, sanBase: 32, sanPorNivel: 5 },
  mago:         { vidaBase: 24, vidaPorNivel: 3, sanBase: 34, sanPorNivel: 6 },
};
const BALANCO_PADRAO = { vidaBase: 30, vidaPorNivel: 4, sanBase: 28, sanPorNivel: 4 };

/* Subdivisões: cada uma soma 6 pontos, distribuídos conforme o foco. Quem foca
   no corpo troca cabeça por casco; quem foca na mente faz o contrário. */
const BALANCO_SUBDIVISAO = {
  // druida — pelo tipo de animal-laço
  mistico: { vida: 0, sanidade: 6 },
  natural: { vida: 6, sanidade: 0 },
  // sereia / tritão
  sereia: { vida: 0, sanidade: 6 },
  triton: { vida: 6, sanidade: 0 },
  // guerreiro
  brutus: { vida: 8, sanidade: -2 },
  pritzk: { vida: 0, sanidade: 6 },
  nerena: { vida: 4, sanidade: 2 },
  // pirata
  predileto_mares: { vida: 8, sanidade: -2 },
  trapaceiro: { vida: 0, sanidade: 6 },
  mestre_redemoinhos: { vida: 4, sanidade: 2 },
  // nascido de ouro
  bobo_corte: { vida: 0, sanidade: 6 },
  dono_coroa: { vida: 2, sanidade: 4 },
  ensanguentado: { vida: 8, sanidade: -2 },
};
const balancoSubdivisao = (char) =>
  BALANCO_SUBDIVISAO[char?.subdivisaoId] || BALANCO_SUBDIVISAO[char?.subdivisaoAnimalTipo] || { vida: 0, sanidade: 0 };


/* ---------- dicionários do universo e das classes ---------- */
const DICIONARIOS = [
  {
    id: 'geral',
    titulo: 'O universo de Terarpeqá',
    subtitulo: 'Dicionário geral',
    classeId: null,
    secoes: [
      {
        titulo: 'Introdução',
        paragrafos: [
          `Terarpeqá é um sistema de RPG estilo medieval, épico e fantasioso, que surgiu de uma história chamada "As Crônicas do País Perdido", que está sendo escrita e planejada há quase cinco anos, e ainda não pôde ser finalizada. Conceitos como classes, feitiços, lugares e personagens tiveram inspiração de diversas obras, incluindo Dungeons and Dragons: Fúria entre Rebeldes, Ordem Paranormal, A Odisseia, todas as obras lidas do autor Brandon Sanderson (maior inspiração), músicas da banda Ghost, Wolfsong, entre muitas outras.`,
          `Regras, mecânicas e perícias tiveram três sistemas como inspiração: Ordem Paranormal (o famoso C.R.I.S), Disco Elysium e Dungeons and Dragons.`,
          `Em geral, jogadores não sabem quem ou o que é Terarpeqá, apesar de alguns personagens terem informações privilegiadas sobre o seu conceito, a depender de fatores como lore, classe e em qual das eras se passa a campanha.`,
          `Campanhas podem ou não se tornarem canônicas dentro do universo, tudo depende da ordem das coisas e, acima de tudo, como a mestra pode lidar com isso. Até porque, muito sobre o passado, presente e futuro do universo já está escrito. Jogadores podem questionar a mestra sobre a veracidade dos fatos dentro da linha do tempo do universo livremente.`,
        ],
      },
      {
        titulo: 'Marcas',
        paragrafos: [
          `Todo jogador dentro do universo, bem como NPCs, possuem marcas pelo corpo. Você nasce e morre com elas em sua pele. Essas marcas são pequenos desenhos em formatos diversos, e possuem a cor da sua classe: magos possuem marcas azuis (dos mais diversos tons), piratas possuem marcas laranjas, druidas possuem marcas verdes, tritões e sereias possuem marcas verde-água, nascidos do ouro possuem marcas douradas, nascidos da prata possuem marcas prata e guerreiros possuem marcas roxas. Cada classe possui um dicionário próprio.`,
          `O formato das marcas deve ser escolhido pelo jogador, preferencialmente depois de sua lore ser escrita, e deve ser informado à mestra.`,
          `Atualmente, não há nenhuma informação que responda sobre os motivos das marcas existirem. Muitos acreditam que os deuses as criaram para distinguir seus filhos, outros acreditam que o formato da marca está atrelado ao passado, presente ou futuro da pessoa. Nada pôde ser confirmado pelos deuses até então.`,
          `Formatos de marca não são exclusivos de classe, mas não podem se repetir: dois jogadores ou dois NPCs não podem possuir o mesmo formato, pelo menos não ao mesmo tempo. No entanto, após a morte do portador da marca, seu formato pode ser adquirido por um nascimento posterior. Também não se sabe como as pessoas com o mesmo formato de marca se interligam.`,
          `Deuses, pelo menos em suas formas físicas, não possuem marcas específicas, e sim um amalgamado de desenhos em suas peles que se mexem como elementos vivos quando utilizam seus poderes divinos.`,
        ],
      },
      {
        titulo: 'Deuses',
        paragrafos: [
          `Todas as classes possuem um deus, que também é considerado sua mãe ou pai. Cada deus possui um traço de personalidade bem marcante, bem como maneiras de governar, viver e se expressar diferentes. Todos os deuses são irmãos e se tratam como tal (pelo menos é o que dizem por aí).`,
          `Melôdia é mãe dos druidas. Împera é mãe de guerreiros, nascidos do ouro e nascidos da prata. Âncore é pai de sereias, tritões e piratas. Karzaron é pai dos magos.`,
          `Cada personalidade e forma de governar está escrita no dicionário de cada classe.`,
        ],
      },
    ],
  },

  {
    id: 'druida',
    titulo: 'Dicionário dos Druidas',
    subtitulo: 'Filhos de Melôdia',
    classeId: 'druida',
    secoes: [
      {
        titulo: 'Quem é seu Deus',
        paragrafos: [
          `Você é filho de Melôdia, e quem já a viu pessoalmente a descreveria em uma palavra: bondade. Melôdia é uma deusa disciplinada, calma e, acima de tudo, de bom coração, sem deixar sua sabedoria de lado. Ela cuida de quem ama, acalma quem precisa.`,
          `Melôdia tem a lealdade da natureza e dos animais ao seu lado e, como filho dela, você possui essa lealdade também. Melôdia te deu o poder de fazer laço com animais, podendo usar suas características para lutar, proteger, viver e amar. Use esse poder com sabedoria.`,
          `Melôdia não precisa de administração nenhuma em seu reino: seus filhos obedecem seus conselhos porque a amam e não precisam de mais motivos. Druidas podem sair e entrar em seu reino quando bem quiserem. Não há nada em um druida que o torne mais forte do que qualquer outro. Todos ficam ao lado de Melôdia, e Melôdia não se esconde de ninguém: sua forma física sempre está em seu reino conversando, acolhendo, treinando e ensinando todos os seus filhos como viverem junto uns aos outros, com respeito, amor e segurança.`,
          `É diferente de seus irmãos, que só aparecem para alguns filhos e em algumas situações específicas. Melôdia conhece todos os seus filhos pessoalmente, sabe seus nomes, suas aparências e vozes. Até porque… ela precisa guiar seus caminhos até seu reino. Até seus lares.`,
        ],
      },
      {
        titulo: 'Mecânica de Nascimento',
        paragrafos: [
          `Quando Melôdia nasceu, ela foi amaldiçoada. Ninguém sabe por que e nem por quem, parece ser um segredo. Mas essa maldição é simples: nenhum filho de Melôdia nasce diretamente em seu reino, e druidas não nascem de druidas.`,
          `Filhos de Melôdia nascem apenas nos reinos dos irmãos, nascem de outras classes (entre dois magos, entre nascidos da prata, entre tritões e sereias, etc). Ou seja: todos os druidas são inférteis e nascem longe de casa, talvez no Reino de Karzaron, talvez no Reino de Împera… em qualquer lugar, menos no reino de Melôdia.`,
          `Melôdia guia seus filhos através de suas mentes, em seus sonhos. Toda vez que um druida ainda não achou seu caminho para casa, ao dormir, Melôdia conversa com ele, o ajuda, o ouve, o ensina a criar seu primeiro laço com animais, o ensina sobre o mundo ao seu redor, o ensina sobre magos, tritões, sereias, piratas, guerreiros… e diz o que pode ser perigoso. Em quem confiar.`,
          `Ela sempre diz a seus filhos que primeiro estejam preparados para ir para casa antes de seguirem o caminho, e que venham em segurança. Talvez isso demore anos, décadas… mas seus filhos precisam ser pacientes, ela sempre diz. Mesmo que venham já adultos ou idosos.`,
          `Ou mesmo que morram no caminho, Melôdia ainda lembrará de seus nomes, aparências e personalidades. Ela guarda cada filho em seu coração.`,
        ],
      },
      {
        titulo: 'Animal-laço',
        paragrafos: [
          `Todo druida sente algo estranho dentro de si ao nascer, e isso cresce com o tempo. Não é uma sensação ruim, muito pelo contrário. É algo estranhamente confortável, e fica maior perto de certos animais. Isto é um sinal de que há um animal-laço te esperando em algum lugar do universo.`,
          `Ao encontrar este animal, você pode fazer dele seu animal-laço. Isso significa que agora ele é parte de você, e você como druida o reconhece como um igual. Você sabe que juntar forças é melhor do que separá-las, por isso o reivindica de seus laços.`,
          `Você pode se tornar completamente seu animal-laço ou se tornar um ser híbrido, com partes druidas e partes animais. Cada forma, e cada animal, dá bônus e penalidades diferentes durante um combate ou cena social. Discuta com a mestra sobre seus detalhes.`,
          `Você pode ter mais de um animal-laço se este for um animal natural, como uma cobra ou um gato, por exemplo. A mesma regra não se aplica a animais místicos…`,
        ],
      },
      {
        titulo: 'Animal-laço místico',
        paragrafos: [
          `Você sabe que há algo diferente em você desde que nasceu. Por que não consigo me conectar com nenhum animal? Você já tentou com aves, répteis, mamíferos, até mesmo com animais marinhos (com permissão de Âncore). Por que você não consegue? Será que nasceu errado?`,
          `A resposta para isso é porque você provavelmente tem um animal-laço místico te esperando. Animais místicos são muito fortes, então você tirou a sorte grande! Porém também são muito raros, então tenha paciência. Talvez leve anos para você conseguir achar seu animal-laço.`,
          `Diferente dos animais naturais, você só pode se conectar com um animal místico por toda a sua vida, e ele será seu companheiro eterno.`,
          `Mas cuidado: ao se conectar com seu animal místico, você já não possui a mesma liberdade de se transformar quando bem quiser. Animais místicos são poderosos demais, e sabem que são, por isso não querem ser apenas uma parte de seu ser. Eles querem todo o controle.`,
        ],
      },
    ],
  },

  {
    id: 'sereia',
    titulo: 'Dicionário das Sereias e Tritões',
    subtitulo: 'Filhos de Âncore',
    classeId: 'sereia',
    secoes: [
      {
        titulo: 'Quem é seu Deus',
        paragrafos: [
          `Você é filho de Âncore, e quem já o viu pessoalmente poderia o resumir em duas palavras: coragem e felicidade. Seu deus é um poço de vida ambulante que não esconde nada do que sente, sejam coisas boas ou coisas ruins, e também fala tudo que vem em sua cabeça sem nem mesmo pensar antes. Este é Âncore, o rei dos mares.`,
          `Ancorê, diferente dos irmãos, possui dois reinos: a superfície do mar e tudo o que há debaixo dele. Ancorê é dono de toda a água que ronda os reinos dos irmãos, mas também é dono do fundo do oceano, que é onde seus filhos sereias e tritões vivem. Diferente dos piratas, vivem em harmonia, sem ter que batalhar muito para conquistar as coisas.`,
        ],
      },
      {
        titulo: 'As exigências de Âncore',
        paragrafos: [
          `Existem algumas exigências que nem sempre são cumpridas: dividir toda a comida que você consegue de naufrágios e caças, pelo menos com as pessoas que moram com você e a vizinhança; participar dos eventos que acontecem semanalmente no castelo de Âncore (o único evento em que o pai aparece com sua forma física para todos os filhos sereias e tritões); respeitar os piratas; e participar de todos os encontros da Assembleia da Concha se você for convocado.`,
        ],
      },
      {
        titulo: 'A Assembleia da Concha',
        paragrafos: [
          `Ancorê sempre tentou defender os princípios de liberdade, justiça e voz para quem deseja ser ouvido (ou para quem tem coragem de falar), e é por isso que ele criou a Assembleia da Concha: um evento mensal que reúne o representante eleito de cada bairro marítimo de seu reino, onde cada um traz opiniões, sugestões, elogios e críticas das pessoas do seu bairro, estas que sempre são discutidas e viabilizadas.`,
          `Âncore é quem dá a palavra final, e os projetos seguem em frente se apoiados por todos os representantes da Assembleia da Concha.`,
        ],
      },
      {
        titulo: 'Eventos de Final de Semana',
        paragrafos: [
          `Âncore sempre gostou muito de festas e um pouco de baderna, então nada melhor que os eventos de final de semana para animar os nervos de sereias e tritões que ficaram a semana inteira caçando e trabalhando em comércios.`,
          `Os eventos de final de semana ocorrem uma vez por semana e juntam todos os tritões e sereias no castelo de seu pai para festejarem a vida. Uma tradição muito comum que ocorre neste evento (com comida, bebida e álcool à vontade pela noite inteira) é pedir a mão de seu pretendente em casamento à meia-noite.`,
          `Estes eventos são muito aproveitados também por solteiros, que usam a festa para cortejar, convidar para dançar ou simplesmente conversar com um tritão ou sereia do qual lhe interessa.`,
        ],
      },
    ],
  },

  {
    id: 'mago',
    titulo: 'Dicionário dos Magos',
    subtitulo: 'Filhos de Karzaron',
    classeId: 'mago',
    secoes: [
      {
        titulo: 'Quem é seu Deus',
        paragrafos: [
          `Você é filho de Karzaron, e magos que o conheceram pessoalmente dizem por aí que sua personalidade se resume a duas palavras: inteligência e ambiciosidade. Karzaron é um deus sério, quieto e que segue a lógica o máximo que conseguir.`,
          `Karzaron criou a magia que está dentro de você, mago, e você deve ser grato até seu último suspiro. Este é um presente que nenhum dos outros deuses conseguiria replicar. E você o possui, então use-o com sabedoria.`,
          `O reino de Karzaron possui uma administração simples: magos possuem livre arbítrio sobre suas vidas e não são penalizados por suas escolhas de carreira ou modo de viver. A lógica de Karzaron é fazer com que seus filhos escolham, aprendam, errem, acertem, e sigam esse ciclo até encontrarem seus caminhos. Obviamente, uma vida de estudos e poder sempre terá seus privilégios, mas isso não impede nenhum mago de viver com sua própria dignidade em simplicidade.`,
          `Comércios são valorizados, e professores possuem o máximo de respeito. Karzaron defende que o melhor que alguém pode fazer enquanto viver é aprender e ensinar, passar adiante os mais diversos conhecimentos. Comida, água, medicina, moradia e livros, bem como pergaminhos e materiais de escrita, são necessidades básicas e não custam dinheiro no reino de Karzaron.`,
          `O reino de Karzaron é um lugar de liberdade, mas também pode ser um lugar de poder e ambição.`,
        ],
      },
      {
        titulo: 'Nível mágico',
        paragrafos: [
          `Que todo mago nasce com magia dentro de si, está explícito. Mas o que diz quais são os magos mais fortes do reino de Karzaron? A resposta está em seus níveis mágicos.`,
          `O nível mágico de um mago cresce por dois fatores: treino (que te dá uma magia apta e verdadeira, legítima) e o que chamamos de manteiga azul, que será explicado mais à frente.`,
          `O treino de magos geralmente vem das escolas de magia, que estão espalhadas por todo o reino. Magos são matriculados nessas escolas desde pequenos, e podem ficar nelas pelo restante de suas vidas se desejarem, assim como se especializar em diversas áreas de magia. As turmas das escolas de magia são determinadas pelos seus níveis mágicos.`,
          `Conquistar níveis mágicos não é fácil. Requer muitos anos de comprometimento, treinos, estudos e principalmente calma e paciência. É por isso que muitos magos desistem em seus caminhos e saem das escolas de magia para viver em comércios de artefatos mágicos, roupas mágicas, comidas mágicas, entre outras áreas.`,
          `As cores das marcas dos magos ficam mais escuras conforme o nível mágico sobe. Ou seja: você consegue saber o quão poderoso um mago é só olhando a cor de suas marcas.`,
          `O máximo que um mago pode chegar é o nível 100, que é quando o mago deixa de ser um mago azul e se torna um Mago Negro.`,
        ],
      },
      {
        titulo: 'Magos Negros',
        paragrafos: [
          `São magos que possuem o ápice da magia dada por Karzaron, que dedicaram suas vidas para aprender sobre o poder dentro de si. Nunca houve nenhum caso de um mago negro jovem, pois conquistar magia depende de tempo, e esses magos escolheram ser pacientes.`,
          `Karzaron é sempre grato a todos os magos negros que surgem ao longo dos milênios, e faz de todos seus braços direitos, conquistando posições de reconhecimento pelo deus, até mesmo sua amizade e respeito.`,
          `Magos negros possuem acesso a informações privilegiadas sobre o universo, bem como feitiços poderosos e itens de raridade inimaginável.`,
          `Os magos negros são tão raros de existirem que apenas há um por milênio, pelo o que dizem os escritos do Reino de Karzaron. Nenhum deles nunca foi esquecido pelo seu pai e deus, Karzaron.`,
        ],
      },
      {
        titulo: 'Manteiga Azul',
        paragrafos: [
          `Conquistar níveis mágicos é sempre muito difícil. É por isso que muitos magos escolhem o caminho mais fácil: a manteiga azul.`,
          `A manteiga azul é um alimento mágico que cresce nas montanhas do Reino de Karzaron, que foi descoberto há muito tempo por magos rurais e começou a ser comercializado por todo o reino após descobrirem sua força.`,
          `Basicamente, após um mago ingerir uma quantidade considerável de manteiga azul, sua magia cresce de nível temporariamente, dando uma falsa sensação de poder a magos que possuem níveis mágicos inferiores. A manteiga azul se tornou um refúgio para os magos que não aguentaram a espera pelos frutos dos estudos e treinos de magia, se tornando uma fonte de poder rápida, mas cara.`,
          `A manteiga azul possui dois efeitos colaterais: você se torna dependente dela (seu corpo quer ela, precisa dela, em quantidades cada vez maiores para lançar as magias), e ela enfraquece a cor das suas marcas permanentemente a cada uso.`,
          `Digamos que você é um mago de nível 40 e decide usar manteiga azul. Enquanto estiver em seu efeito, você se torna equivalente a um mago de nível 80, porém, quando seu efeito acaba, você agora é um mago de nível 35 (ou 30 se você tiver usado muito), e suas marcas ficam com uma cor mais fraca.`,
          `Karzaron proibiu seu uso uma década após ela ser descoberta (cerca de metade da população mágica estava se tornando dependente da manteiga azul, e as escolas de magia estavam ficando cada vez mais vazias), mas a droga ainda é comercializada por debaixo dos panos em uma quantidade menor, e mais raramente.`,
        ],
      },
      {
        titulo: 'Parceiro mágico',
        paragrafos: [
          `Apesar de ser um deus de pura lógica, Karzaron nunca desprezou as relações pessoais. Pelo contrário: ele sempre defendeu que uma boa relação pode alavancar os poderes dentro de si. É por isso que magos podem ter, ou não, um parceiro mágico à sua escolha.`,
          `Parceiros mágicos podem ser uma relação de amizade muito forte com outro mago, como uma irmandade, mas pode também ser uma relação romântica inabalável. Fica a critério do jogador qual será o tipo de relação com seu parceiro mágico.`,
          `Você precisa passar por um ritual de conexão: um terá a marca do outro em seus peitos, em frente a seus corações. Para isso, você e seu parceiro precisam ir para um lugar simbólico para ambos, tocarem as mãos no lugar em que as marcas ficarão e olharem nos olhos um do outro. Os parceiros precisarão permanecer nesta mesma posição por uma semana inteira. Cada dia que passa, suas mãos arderão, quase como fogo. Isso significa que a marca está sendo desenhada com sucesso. A dor sobe cada dia, mas é preciso aguentar até que as marcas estejam prontas, sem desviar o olhar, nem mesmo comer, beber água ou se mexer.`,
          `Parceiros, quando próximos um do outro, concedem bônus variáveis que devem ser discutidos ou implementados pela mestra.`,
          `A morte de seu parceiro te causará efeitos maléficos, que podem durar pelo resto de sua vida. Você não quer nem pensar nessa possibilidade. Muitos magos escolhem não ter parceiros por conta do medo de perdê-los e dos efeitos que podem causar.`,
        ],
      },
    ],
  },

  {
    id: 'guerreiro',
    titulo: 'Dicionário dos Guerreiros',
    subtitulo: 'Filhos de Împera',
    classeId: 'guerreiro',
    secoes: [
      {
        titulo: 'Quem é seu Deus',
        paragrafos: [
          `Você é filho de Împera e, sinceramente, não sabe nada dessa deusa além de seu nome. Até porque os boatos nunca chegam até esse lugar imundo e pequeno que você vive. Eles se perdem no meio do caminho. Você acredita que ela não goste muito de vocês, guerreiros, por motivos que também nunca chegaram aos seus ouvidos.`,
          `A única administração que você conhece é dentro da Arena: você nasceu aqui dentro, com vozes vindo de fora, comentando sobre qual guerreiro apostariam na luta do dia seguinte. Eles te colocaram muito novo em um lugar com vários de seus semelhantes e foi escolhido a dedo por pessoas de marcas prateadas, podres de ricas. Disseram que você teria potencial, e desde então, você luta.`,
          `Você luta na frente de todas essas pessoas porque sabe que é isso que te dá comida (a da menor qualidade), água (a mais suja de todas) e um espaço para dormir (junto a ratos, baratas e goteiras), o que é engraçado, porque você tem certeza que essa armadura que você usa ou essa arma que você carrega poderiam te alimentar pelo resto da sua vida se fossem vendidas.`,
          `No final, você luta porque sabe que é a única coisa que te restou a fazer.`,
        ],
      },
      {
        titulo: 'A Arena',
        paragrafos: [
          `Você não sabe o que existe fora daqui. Sabe que existe, porque as pessoas que vêm assistir chegam de algum lugar e voltam pra algum lugar, mas o mundo, pra você, tem o tamanho de um círculo de areia com arquibancadas em volta.`,
          `A Arena tem uma rotina e você a decorou antes de aprender a segurar uma espada: treina de manhã, apanha de tarde, luta quando mandam. Ninguém explica as regras, mas você aprende vendo quem morre por não saber delas.`,
          `Também não existe descanso de verdade. Existe o intervalo entre uma luta e a próxima, e você aprendeu a chamar isso de descanso porque não conhece outra coisa que poderia ser.`,
        ],
      },
      {
        titulo: 'Sua Família Patrona',
        paragrafos: [
          `Você tem dono. Não é uma palavra bonita, mas é a certa.`,
          `Cada família de prata influente o bastante pra ter cadeira boa nas arquibancadas tem um guerreiro. Você é o deles. Eles escolheram seu nome de luta, pagam pelo que você come, decidem contra quem você entra — e quando acham que você não vale mais o investimento, arranjam outro.`,
          `Em troca, você recebe o treinamento deles. É o motivo de você lutar do jeito que luta e não de outro: seu corpo foi moldado pela família que te comprou, e você não teve voz nenhuma nisso.`,
          `Alguns guerreiros odeiam seus donos. Outros são gratos, porque sem eles estariam mortos há anos. Os dois estão certos, e é isso que torna a coisa insuportável.`,
        ],
      },
      {
        titulo: 'As Apostas',
        paragrafos: [
          `Todo mundo ganha dinheiro com você. Menos você.`,
          `As famílias apostam umas contra as outras, e valores absurdos trocam de mão dependendo de quantas rodadas você aguenta em pé. Já teve dia em que mandaram você perder de propósito, e você perdeu, porque a alternativa era pior.`,
          `Existe uma coisa engraçada nisso: enquanto você luta, você é a pessoa mais importante daquele lugar. Milhares de olhos, gritos, seu nome na boca de todo mundo. Aí a luta acaba e você volta a ser alguém que dorme perto de ratos.`,
        ],
      },
    ],
  },

  {
    id: 'pirata',
    titulo: 'Dicionário dos Piratas',
    subtitulo: 'Filhos de Âncore',
    classeId: 'pirata',
    secoes: [
      {
        titulo: 'Quem é seu Deus',
        paragrafos: [
          `Você é filho de Âncore, e quem já o viu pessoalmente poderia o resumir em duas palavras: coragem e felicidade. Seu deus é um poço de vida ambulante que não esconde nada do que sente, sejam coisas boas ou coisas ruins, e também fala tudo que vem em sua cabeça sem nem mesmo pensar antes. Este é Âncore, o rei dos mares.`,
          `Ancorê, diferente dos irmãos, possui dois reinos: a superfície do mar e tudo o que há debaixo dele. Âncore é dono de toda a água que ronda os reinos dos irmãos, e é em mar aberto que seus filhos piratas vivem, lutando contra ou sendo os preferidos do mar.`,
          `Não há regras no mar: sobrevivem apenas os bandos piratas mais fortes ou mais espertos, seja de maneira honesta ou não. Âncore sempre defendeu que seus filhos deveriam ser corajosos e, se não fossem, então estariam sujeitos a morrer naturalmente.`,
        ],
      },
      {
        titulo: 'Os Bandos Piratas',
        paragrafos: [
          `Ninguém sobrevive sozinho, então você precisa de um bando para chamar de seu. Pode não ser o mais perfeito, organizado ou amigável do mundo, mas ainda é seu. O bando é sua família e você deve lutar e ser corajoso pela sobrevivência dela.`,
          `Normalmente o bando possui de cinco a dez pessoas. São raros os bandos com menos ou mais integrantes do que isso. Não é porque um bando é grande que ele será mais forte, e não é porque um bando é pequeno que ele vai ser o mais fraco. Acreditar em seu bando é o que faz dele forte.`,
          `Você nasce nesse bando, mas pode escolher ir para outro, seja por conflitos internos ou questões de dinheiro e sobrevivência. Um pirata sempre sabe o que é melhor para ele, mas é preciso coragem para sair de um bando — ainda mais para entrar em um outro e conhecer novas pessoas que podem querer te matar no processo.`,
          `Todos os bandos querem recursos, e é por isso que estão sempre em rixa. A menos que haja um bom motivo, bandos sempre conflitam entre si ao se verem, e tentam conquistar as coisas que o outro tem. Nada é pacífico no mar, a menos que os dois bandos queiram que seja, o que é raro, mas pode acontecer.`,
        ],
      },
      {
        titulo: 'Os Irmãos de Baixo',
        paragrafos: [
          `Sereias e tritões nasceram do mesmo pai que você, da mesma água, e isso vale alguma coisa. Vocês se tratam com respeito quando se encontram: um pirata não afunda um tritão, um tritão não afunda um navio. Existe uma cortesia velha entre a superfície e o fundo, e ela raramente é quebrada. Talvez vocês possam ter até mesmo uma relação harmoniosa, com festas no convés e muita cerveja.`,
          `Mas não confunda respeito com aliança.`,
          `Quando dois bandos se enfrentam e a água fica vermelha, eles assistem. Não descem para salvar quem afunda, nem sobem para terminar o serviço. As brigas da superfície não são problema deles — Ancorê deu a eles as profundezas, e é lá embaixo que ficam. Se você cair no mar durante uma batalha, pode ser que um tritão passe ao seu lado, olhe nos seus olhos, e siga em frente.`,
          `Não é crueldade. É só que a coragem que seu pai exigiu de você, ele exigiu deles também — e a deles não passa por brigas que não são suas.`,
        ],
      },
      {
        titulo: 'Os Navios',
        paragrafos: [
          `Um bando sem navio não é um bando: é um grupo de pessoas encalhadas esperando a morte chegar. O navio é onde vocês dormem, brigam, comem e escondem o que roubaram. Ele tem nome, e você vai defendê-lo como defenderia alguém do bando.`,
          `Quem manda no navio nem sempre é quem manda no bando. O capitão decide para onde ir e quando lutar; quem conhece o casco, as velas e os humores da madeira é quem mantém todo mundo vivo. Bando esperto sabe a diferença entre as duas coisas — bando burro descobre no meio de uma tempestade.`,
          `Ninguém compra um navio. Você herda de um bando que se desfez, toma de um bando que perdeu, ou monta um com o que sobrou de três naufrágios diferentes. Todo navio que navega hoje já foi de outra pessoa, e ela provavelmente morreu nele.`,
          `E eles afundam. Cedo ou tarde, todos afundam. Quando isso acontece, o bando que sobrevive tem duas escolhas: encontrar outro navio antes que a fome resolva o problema, ou se dividir e se juntar a outros bandos. A segunda opção é mais comum, e é assim que quase todo pirata acaba tendo estado em três ou quatro bandos ao longo da vida.`,
          `Ancorê não salva navio nenhum. Ele afunda os que quer e poupa os que acha divertido (ou merecido) poupar.`,
        ],
      },
    ],
  },

  {
    id: 'nascido_ouro',
    titulo: 'Dicionário dos Nascidos do Ouro',
    subtitulo: 'Filhos de Împera',
    classeId: 'nascido_ouro',
    secoes: [
      {
        titulo: 'Quem é seu Deus',
        paragrafos: [
          `Împera participa diariamente da vida de vocês, nascidos do ouro, e vocês conseguem resumir sua deusa em duas simples palavras: autoridade e rigidez. Vocês raramente veem um sorriso no rosto de Împera, muito menos um lampejo de bondade que seja. Împera não gosta quando a chamam de mãe, gosta de ser chamada de imperatriz, de senhora. Mas vocês sentem um afeto maternal vindo dessa deusa de qualquer forma, e ela parece saber disso, embora não a agrade.`,
          `Seu trono é uma autonomia falsa. Vocês dão ordens, enviam tropas, recrutam pessoas, comandam expedições, entretanto, cada palavra que sai de suas bocas precisa ser aprovada antes por Împera. Suas rotinas são controladas por ela em reuniões diárias durante o café da manhã. Se você sair deste planejamento dela, ela saberá, e você pode ser repreendido. O que, vindo dela, não agrada a ninguém.`,
          `Guerreiros são marionetes dos nascidos da prata, nascidos da prata são suas marionetes, e vocês são marionetes de Împera. Este é o mundo ideal da deusa: poder fracionado em poucas mãos, e tudo conquistado por uma meritocracia que destrói vidas.`,
          `O reino de Împera é o maior de todos, entretanto, é o único reino em que filhos de Împera passam fome, sede e, muitos deles, em maioria quem não consegue trabalho, moram na rua, em partes periféricas do reino. Împera sabe que esses fatores existem e gosta que eles existam. Ela defende que todos devem lutar por aquilo que querem, e nada vem de graça.`,
        ],
      },
      {
        titulo: 'As Famílias de Prata',
        paragrafos: [
          `Existem três principais: Brutus, Pritzk e Nerêna. Cada família tem posse de vários comércios espalhados pelo reino e é isso que as torna as famílias mais ricas e mais influentes no mundo da prata.`,
          `Muito de sua fortuna também vem dos valores que os cidadãos apostam nos guerreiros das arenas, e essas três famílias são as que possuem maior parte de todos os guerreiros, principalmente os mais fortes.`,
          `Essas três famílias têm um objetivo em comum: se tornarem nascidos do ouro. E isso só pode acontecer se algum de seus filhos casar com o próximo rei, ou seja, algum dos filhos do atual rei do reino de Împera.`,
        ],
      },
      {
        titulo: 'Entrega da Coroa',
        paragrafos: [
          `Ninguém nasce herdeiro. Vocês nascem candidatos, e isso é bem pior.`,
          `A coroa não vai para o mais velho, nem para o mais forte, nem para quem Împera mais gosta — ela vai para quem melhor respeitou os princípios dela ao longo de uma vida inteira. Disciplina. Rigidez. Autoridade que não dobra. Aquilo que ela é, e que espera ver reproduzido em vocês.`,
          `O problema é que Împera nunca escreveu esses princípios em lugar nenhum. Não existe lista, não existe prova, não existe uma data em que a decisão será tomada. Existem as reuniões de café da manhã, existe o modo como ela olha para você quando você responde, e existe uma contagem silenciosa que ela faz e que ninguém mais tem acesso.`,
          `Então vocês passam a vida sendo avaliados sem saber exatamente por quê. Cada ordem que você dá, cada expedição que comanda, cada vez que hesita na frente dela — tudo isso entra numa conta que você não pode conferir. E como vocês são muitos, cada acerto de um irmão é uma perda sua.`,
          `É por isso que a corte é do jeito que é. Ninguém confia em ninguém, todo mundo é gentil, e a gentileza é a coisa mais falsa que existe naquele palácio. Você aprende cedo que o irmão que te ajuda numa reunião pode estar te deixando falar demais de propósito.`,
          `Alguns desistem da coroa em silêncio e passam a viver como querem, o que também é uma escolha — e Împera nota isso na hora. Outros perseguem o trono a vida inteira e morrem sem saber se chegaram perto. E há quem entenda, já adulto, que os princípios de Împera nunca foram feitos para serem alcançados: foram feitos para manter todos os filhos correndo atrás deles até o fim.`,
          `Nada vem de graça. Nem o trono, nem a atenção dela, nem a resposta sobre quem venceu.`,
        ],
      },
    ],
  },
];

/* ---------- catálogo de armas ----------
   peso segue o dano: 1d6 → 0 · 1d8 → 1 · 1d10 → 2 · 1d12 → 3 */
const ARMAS_CATALOGO = [
  /* ===== GUERREIRO ===== */
  { id: 'arm_manoplas_ferro', nome: 'Manoplas de ferro bruto', classe: 'guerreiro', subdivisaoId: 'brutus',
    dano: '3d10', teste: 'Instrumento físico', peso: 3,
    descricao: 'Placas grosseiras amarradas nos punhos, sem acabamento nenhum.' },
  { id: 'arm_correntes_arena', nome: 'Correntes de arena', classe: 'guerreiro', subdivisaoId: 'brutus',
    dano: '3d8', teste: 'Instrumento físico', peso: 2,
    descricao: 'As mesmas que te prenderam quando criança, agora enroladas nos braços. Permite puxar o alvo pra perto.' },
  { id: 'arm_garrote_seda', nome: 'Garrote de seda', classe: 'guerreiro', subdivisaoId: 'pritzk',
    dano: '3d6 (8d6 por surpresa)', teste: 'Silêncio', peso: 1,
    descricao: 'Fio fino que não faz som nenhum. Causa 3d6 se o alvo não sabia da sua presença.' },
  { id: 'arm_bastao_peso', nome: 'Bastão de peso', classe: 'guerreiro', subdivisaoId: 'pritzk',
    dano: '3d8 não-letal', teste: 'Velocidade de reação', peso: 2,
    descricao: 'Bastão curto e denso, feito pra derrubar sem matar.' },
  { id: 'arm_espada_longa', nome: 'Espada de lâmina longa', classe: 'guerreiro', subdivisaoId: 'nerena',
    dano: '3d12', teste: 'Coordenação motora', peso: 4,
    descricao: 'Bem balanceada, feita sob medida pela família.' },
  { id: 'arm_arco_osso', nome: 'Arco recurvo de osso', classe: 'guerreiro', subdivisaoId: 'nerena',
    dano: '3d10', teste: 'Coordenação motora', peso: 3,
    descricao: 'Alcance longo, silencioso, feito de material que ninguém pergunta a origem.' },

  /* ===== DRUIDA ===== */
  { id: 'arm_cajado_raiz', nome: 'Cajado de raiz viva', classe: 'druida',
    dano: '3d8', teste: 'Instrumento físico', peso: 2,
    descricao: 'Madeira que ainda cresce um pouco a cada estação.' },
  { id: 'arm_foice_pedra_lua', nome: 'Foice de pedra-lua', classe: 'druida',
    dano: '3d10', teste: 'Coordenação motora', peso: 3,
    descricao: 'Lâmina curva usada em rituais e, quando preciso, em pescoços.' },

  /* ===== SEREIA / TRITÃO ===== */
  { id: 'arm_concha_afiada', nome: 'Concha afiada', classe: 'sereia', subdivisaoId: 'sereia',
    dano: '3d6 (6d6 na água)', teste: 'Coordenação motora', peso: 1,
    descricao: 'Borda cortante, quase invisível na água.' },
  { id: 'arm_corrente_perolas', nome: 'Corrente de pérolas negras', classe: 'sereia', subdivisaoId: 'sereia',
    dano: '3d8', teste: 'Compostura', peso: 2,
    descricao: 'Bonita de longe, pesada de perto. Pode enrolar no pescoço do alvo.' },
  { id: 'arm_tridente', nome: 'Tridente das profundezas', classe: 'sereia', subdivisaoId: 'triton',
    dano: '3d12', teste: 'Instrumento físico', peso: 4,
    descricao: 'Três pontas, haste longa, feito pra alcançar quem foge.' },
  { id: 'arm_lanca_coral', nome: 'Lança de coral', classe: 'sereia', subdivisaoId: 'triton',
    dano: '3d10', teste: 'Instrumento físico', peso: 3,
    descricao: 'Leve o bastante pra arremessar, dura o bastante pra atravessar.' },

  /* ===== MAGO ===== */
  { id: 'arm_cajado_escrito', nome: 'Cajado escrito', classe: 'mago',
    dano: '3d6', teste: 'Savoir-faire', peso: 1,
    descricao: 'Coberto de palavras gravadas até o topo. Devolve 2 de mana quando acerta.' },
  { id: 'arm_pena_aco', nome: 'Pena de aço', classe: 'mago',
    dano: '3d8', teste: 'Savoir-faire', peso: 2,
    descricao: 'Uma pena de escrever afiada como estilete.' },

  /* ===== PIRATA ===== */
  { id: 'arm_sabre_pesado', nome: 'Sabre pesado', classe: 'pirata', subdivisaoId: 'predileto_mares',
    dano: '3d12', teste: 'Instrumento físico', peso: 4,
    descricao: 'Lâmina larga que corta mais por peso do que por técnica.' },
  { id: 'arm_ancora_mao', nome: 'Âncora de mão', classe: 'pirata', subdivisaoId: 'predileto_mares',
    dano: '3d10', teste: 'Instrumento físico', peso: 3,
    descricao: 'Uma âncora pequena usada como maça. Derruba o alvo se ele falhar em Coordenação motora.' },
  { id: 'arm_adaga_duas_faces', nome: 'Adaga de duas faces', classe: 'pirata', subdivisaoId: 'trapaceiro',
    dano: '3d8 (6d8 se mentiu ao alvo)', teste: 'Drama', peso: 2,
    descricao: 'Uma lâmina de cada lado do punho, pra quando a conversa vira.' },
  { id: 'arm_pistola_emperrada', nome: 'Pistola emperrada', classe: 'pirata', subdivisaoId: 'trapaceiro',
    dano: '5d10', teste: 'Compostura', peso: 3,
    descricao: 'Falha muito, mas ninguém sabe disso além de você. Role 1d6 antes de atirar: em 1 ou 2, ela falha.' },
  { id: 'arm_chave_mestra', nome: 'Chave-mestra reforçada', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos',
    dano: '3d8', teste: "C'est la vie", peso: 2,
    descricao: 'Ferramenta que abre fechaduras e crânios com a mesma eficiência.' },
  { id: 'arm_rede_cordas', nome: 'Rede de cordas', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos',
    dano: 'sem dano', teste: 'Coordenação motora', peso: 2,
    descricao: 'Prende o alvo em vez de feri-lo. O alvo resiste com Instrumento físico ou fica imóvel por 1 rodada.' },

  /* ===== NASCIDO DE OURO ===== */
  { id: 'arm_cetro_guizos', nome: 'Cetro de guizos', classe: 'nascido_ouro', subdivisaoId: 'bobo_corte',
    dano: '3d8', teste: 'Império interior', peso: 2,
    descricao: 'Barulhento, ridículo e mais pesado do que parece.' },
  { id: 'arm_espada_cerimonial', nome: 'Espada cerimonial', classe: 'nascido_ouro', subdivisaoId: 'dono_coroa',
    dano: '3d10', teste: 'Autoridade', peso: 3,
    descricao: 'Feita pra ser vista, não usada — o que a torna surpreendente.' },
  { id: 'arm_lamina_sem_brasao', nome: 'Lâmina sem brasão', classe: 'nascido_ouro', subdivisaoId: 'ensanguentado',
    dano: '3d12', teste: 'Instrumento físico', peso: 4,
    descricao: 'Você lixou o símbolo da família de propósito.' },
  { id: 'arm_escudo_vanguarda', nome: 'Escudo de vanguarda', classe: 'nascido_ouro', subdivisaoId: 'ensanguentado',
    dano: '3d6', teste: 'Limiar da dor', peso: 3,
    descricao: 'Pesado, feito pra ficar entre alguém e o perigo. Concede +5 de defesa enquanto empunhado.' },
];

/* Mesmo filtro das habilidades: classe + subdivisão quando houver */
function armaDisponivel(arma, char) {
  if (fichaLivre(char)) return false; // ficha da mestra nasce sem catálogo
  if (arma.classe !== char.originId) return false;
  if (arma.subdivisaoId && arma.subdivisaoId !== char.subdivisaoId) return false;
  return true;
}

/* Peso total carregado e capacidade (capacidade cresce com Físico) */
function pesoCarregado(char, armasCustom = []) {
  const catalogo = [...ARMAS_CATALOGO, ...armasCustom];
  const armas = (char.armas || []).reduce((soma, id) => {
    const a = catalogo.find((x) => x.id === id);
    return soma + (a?.peso || 0);
  }, 0);
  const itens = (char.inventario || []).reduce((soma, it) => soma + (Number(it.peso) || 0), 0);
  const total = armas + itens + pesoArmadura(char);
  const capacidade = 4 + (char.attributes?.fisico ?? 0) * 2;
  return { total, capacidade, excedido: total > capacidade };
}

/* ---------- catálogo de armaduras ----------
   defesa entra como bônus de equipamento (soma em Defesa, Bloqueio e Esquiva). */
const ARMADURAS_CATALOGO = [
  /* ===== GUERREIRO ===== */
  { id: 'arma_faixas_couro', nome: 'Faixas de couro cru', classe: 'guerreiro', subdivisaoId: 'brutus',
    defesa: 2, peso: 2, descricao: 'Tiras enroladas nos antebraços e no tronco, mais pra não sangrar do que pra não apanhar.' },
  { id: 'arma_peitoral_arena', nome: 'Peitoral de arena', classe: 'guerreiro', subdivisaoId: 'brutus',
    defesa: 5, peso: 4, descricao: 'Chapa dianteira apenas; as costas ficam expostas porque Brutus não recua.' },
  { id: 'arma_traje_sombra', nome: 'Traje de sombra', classe: 'guerreiro', subdivisaoId: 'pritzk',
    defesa: 2, peso: 1, descricao: 'Tecido escuro sem fivelas, sem fechos, sem barulho. Concede +2 em testes de Silêncio.' },
  { id: 'arma_gibao_acolchoado', nome: 'Gibão acolchoado', classe: 'guerreiro', subdivisaoId: 'pritzk',
    defesa: 3, peso: 2, descricao: 'Proteção discreta sob a roupa comum.' },
  { id: 'arma_meia_armadura', nome: 'Meia-armadura de placas', classe: 'guerreiro', subdivisaoId: 'nerena',
    defesa: 4, peso: 3, descricao: 'Protege torso e ombros, deixa os braços livres para o arco.' },
  { id: 'arma_bracadeiras_tiro', nome: 'Braçadeiras de tiro', classe: 'guerreiro', subdivisaoId: 'nerena',
    defesa: 3, peso: 2, descricao: 'Reforço nos antebraços e no peito, feito por armeiro da família.' },

  /* ===== DRUIDA ===== */
  { id: 'arma_manto_liquen', nome: 'Manto de líquen', classe: 'druida',
    defesa: 2, peso: 1, descricao: 'Cresce junto com você e endurece no frio.' },
  { id: 'arma_casca_viva', nome: 'Casca viva', classe: 'druida',
    defesa: 4, peso: 3, descricao: 'Placas de casca de árvore que se renovam sozinhas.' },
  { id: 'arma_pele_segunda_muda', nome: 'Pele de segunda muda', classe: 'druida', animalTipo: 'mistico',
    defesa: 3, peso: 2, descricao: 'Feita do que seu animal descartou. A cada Catástrofe, o DT do teste de Eletroquímica sobe 2 — ela lembra de quem veio.' },

  /* ===== SEREIA / TRITÃO ===== */
  { id: 'arma_veu_escamas', nome: 'Véu de escamas', classe: 'sereia', subdivisaoId: 'sereia',
    defesa: 2, peso: 1, descricao: 'Camada fina e iridescente, quase invisível fora d\u2019água.' },
  { id: 'arma_coroa_nacar', nome: 'Coroa de nácar', classe: 'sereia', subdivisaoId: 'sereia',
    defesa: 3, peso: 2, descricao: 'Adorno rígido que protege cabeça e pescoço.' },
  { id: 'arma_couraca_casco', nome: 'Couraça de casco', classe: 'sereia', subdivisaoId: 'triton',
    defesa: 5, peso: 4, descricao: 'Feita de carapaças de criaturas do fundo.' },
  { id: 'arma_placas_arraia', nome: 'Placas de arraia', classe: 'sereia', subdivisaoId: 'triton',
    defesa: 3, peso: 2, descricao: 'Cobre o dorso e desliza na água.' },

  /* ===== MAGO ===== */
  { id: 'arma_vestes_escritas', nome: 'Vestes escritas', classe: 'mago',
    defesa: 2, peso: 1, descricao: 'Túnica coberta de anotações a tinta. Devolve 1 de mana no começo de cada cena.' },
  { id: 'arma_manto_margem', nome: 'Manto de margem', classe: 'mago',
    defesa: 3, peso: 2, descricao: 'Forro grosso com bolsos internos para páginas soltas.' },

  /* ===== PIRATA ===== */
  { id: 'arma_casaco_capitao', nome: 'Casaco de capitão', classe: 'pirata', subdivisaoId: 'predileto_mares',
    defesa: 4, peso: 3, descricao: 'Couro pesado, botões de latão, ombros reforçados.' },
  { id: 'arma_colete_cordas', nome: 'Colete de cordas', classe: 'pirata', subdivisaoId: 'predileto_mares',
    defesa: 2, peso: 2, descricao: 'Nós apertados que amortecem golpes.' },
  { id: 'arma_casaca_duas_caras', nome: 'Casaca de duas caras', classe: 'pirata', subdivisaoId: 'trapaceiro',
    defesa: 3, peso: 2, descricao: 'Reversível: de um lado nobre, do outro maltrapilha. Concede +2 em testes de Drama.' },
  { id: 'arma_faixa_bolsos', nome: 'Faixa de bolsos falsos', classe: 'pirata', subdivisaoId: 'trapaceiro',
    defesa: 2, peso: 1, descricao: 'Cheia de compartimentos, quase todos vazios.' },
  { id: 'arma_avental_couro', nome: 'Avental de couro e ferramentas', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos',
    defesa: 3, peso: 2, descricao: 'Prático, resistente, sempre com algo útil pendurado.' },
  { id: 'arma_placas_casco_navio', nome: 'Placas de casco de navio', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos',
    defesa: 4, peso: 3, descricao: 'Restos de embarcação amarrados no torso.' },

  /* ===== NASCIDO DE OURO ===== */
  { id: 'arma_traje_guizos', nome: 'Traje de guizos reforçado', classe: 'nascido_ouro', subdivisaoId: 'bobo_corte',
    defesa: 2, peso: 1, descricao: 'Ridículo por fora, acolchoado por dentro.' },
  { id: 'arma_colete_bordado', nome: 'Colete bordado', classe: 'nascido_ouro', subdivisaoId: 'bobo_corte',
    defesa: 3, peso: 2, descricao: 'Fios de ouro entrelaçados fazem mais que decorar.' },
  { id: 'arma_armadura_gala', nome: 'Armadura de gala', classe: 'nascido_ouro', subdivisaoId: 'dono_coroa',
    defesa: 5, peso: 4, descricao: 'Dourada, polida, feita para ser vista de longe. Concede +2 em testes de Autoridade.' },
  { id: 'arma_manto_real', nome: 'Manto real', classe: 'nascido_ouro', subdivisaoId: 'dono_coroa',
    defesa: 3, peso: 3, descricao: 'Pesado, longo, imponente.' },
  { id: 'arma_armadura_sem_brasao', nome: 'Armadura completa sem brasão', classe: 'nascido_ouro', subdivisaoId: 'ensanguentado',
    defesa: 6, peso: 5, descricao: 'Proteção total, símbolo nenhum.' },
  { id: 'arma_cota_malha_usada', nome: 'Cota de malha usada', classe: 'nascido_ouro', subdivisaoId: 'ensanguentado',
    defesa: 4, peso: 3, descricao: 'Já foi de outra pessoa, e ela não voltou.' },
];

function armaduraDisponivel(a, char) {
  if (fichaLivre(char)) return false;
  if (a.classe !== char.originId) return false;
  if (a.subdivisaoId && a.subdivisaoId !== char.subdivisaoId) return false;
  if (a.animalTipo && a.animalTipo !== char.subdivisaoAnimalTipo) return false;
  return true;
}

/* Bônus de defesa da armadura equipada (só uma por vez). */
function bonusArmadura(char, custons = []) {
  const catalogo = [...ARMADURAS_CATALOGO, ...custons];
  const a = catalogo.find((x) => x.id === char.armaduraId);
  return a?.defesa || 0;
}
function pesoArmadura(char, custons = []) {
  const catalogo = [...ARMADURAS_CATALOGO, ...custons];
  const a = catalogo.find((x) => x.id === char.armaduraId);
  return a?.peso || 0;
}

/* ---------- catálogo de itens de inventário ---------- */
const ITENS_CATALOGO = [
  /* ===== DRUIDA ===== */
  { id: 'ite_cantil_seiva', nome: 'Cantil de seiva', classe: 'druida', peso: 2,
    descricao: 'Recupera 2d6 de vida. Enche sozinho a cada amanhecer.' },
  { id: 'ite_osso_marcado', nome: 'Osso marcado', classe: 'druida', peso: 1,
    descricao: 'Enterrado num lugar, guarda uma mensagem sua que só outro druida consegue ouvir. Colocar este item com uma mensagem fincado no chão gasta o item.' },
  { id: 'ite_casulo_adormecido', nome: 'Casulo adormecido', classe: 'druida', peso: 2,
    descricao: 'Guarda uma criatura pequena que eclode quando a mestra decidir. Você não escolhe qual, mas pode escolher tentar criar um laço ou não com este animal. Gasta ao se chocar.' },
  { id: 'ite_coleira_sem_dono', nome: 'Coleira sem dono', classe: 'druida', animalTipo: 'natural', peso: 1,
    descricao: 'Concede +5 no teste de Ágape para criar um novo laço.' },
  { id: 'ite_vertebra_primeiro_dono', nome: 'Vértebra do primeiro dono', classe: 'druida', animalTipo: 'mistico', peso: 2,
    descricao: 'Um osso do animal místico de outro druida, morto há tempos. Segurando-o durante a Catástrofe, você pode fazer o teste de Eletroquímica com Volição no lugar. Não gasta, mas o seu animal odeia quando você usa.' },

  /* ===== SEREIA / TRITÃO ===== */
  { id: 'ite_frasco_agua_natal', nome: 'Frasco de água natal', classe: 'sereia', peso: 2,
    descricao: 'Água do seu reino. Bebida, recupera 3d6 de sanidade.' },
  { id: 'ite_batom_escamas', nome: 'Batom de escamas', classe: 'sereia', subdivisaoId: 'sereia', peso: 2,
    descricao: 'Enquanto usado, +5 em testes de Drama e Autoridade. Não gasta.' },
  { id: 'ite_escama_arrancada', nome: 'Escama arrancada', classe: 'sereia', subdivisaoId: 'triton', peso: 1,
    descricao: 'Você arranca uma escama própria e entrega a alguém. Enquanto essa pessoa a carregar, você sabe se ela está viva e se está com medo. Não gasta.' },

  /* ===== MAGO ===== */
  { id: 'ite_pagina_em_branco', nome: 'Página em branco', classe: 'mago', peso: 2,
    descricao: 'Copia um feitiço que você viu ser conjurado nesta cena e permite usá-lo uma vez, pelo dobro do custo. Não pode ser um feitiço de nível maior do que você poderia conjurar normalmente.' },
  { id: 'ite_lupa_leitura', nome: 'Lupa de leitura profunda', classe: 'mago', peso: 2,
    descricao: 'Revela se um texto tem mensagem oculta, código ou magia. Não gasta.' },
  { id: 'ite_vela_estudo', nome: 'Vela de estudo', classe: 'mago', peso: 1,
    descricao: 'Queima por uma noite; enquanto acesa, você não sente sono nem fome.' },
  { id: 'ite_frasco_tinta_emprestada', nome: 'Frasco de tinta emprestada', classe: 'mago', peso: 2,
    descricao: 'Guarda 10 da sua mana e pode ser dado para outro mago para uso posterior. Enche uma vez por sessão. Você perde 10 de mana para enchê-lo e o item só é gasto ao ser entregue a outro mago.' },
  { id: 'ite_pena_asa_negra', nome: 'Pena de asa negra', classe: 'mago', nivelMin: 'negro', peso: 2,
    descricao: 'Uma vez por sessão, conjure um feitiço sem gastar sanidade.' },

  /* ===== GUERREIRO ===== */
  { id: 'ite_pedra_amolar', nome: 'Pedra de amolar', classe: 'guerreiro', peso: 2,
    descricao: 'Uma vez por cena, sua arma causa +1d6 até o final da cena.' },
  { id: 'ite_corrente_prender', nome: 'Corrente curta de prender', classe: 'guerreiro', peso: 2,
    descricao: 'Imobiliza um alvo derrubado até ele passar num teste de Instrumento físico com DT variável. Não gasta.' },
  { id: 'ite_cantil_aguardente', nome: 'Cantil de aguardente', classe: 'guerreiro', peso: 2,
    descricao: 'Recupera 2d6 de sanidade, mas você fica com −5 em testes de Intelecto por 1 cena.' },
  { id: 'ite_corda_puxar', nome: 'Corda de puxar', classe: 'guerreiro', subdivisaoId: 'brutus', peso: 2,
    descricao: 'Amarrada na cintura, permite arrastar algo (ou alguém) muito mais pesado que você. Não gasta.' },
  { id: 'ite_po_cegueira', nome: 'Pó de cegueira', classe: 'guerreiro', subdivisaoId: 'pritzk', peso: 1,
    descricao: 'Cega um alvo por 1 rodada; ele resiste com Velocidade de reação.' },
  { id: 'ite_giz_mira', nome: 'Giz de mira', classe: 'guerreiro', subdivisaoId: 'nerena', peso: 1,
    descricao: 'Marca um alvo à distância. Enquanto a marca durar (2 rodadas), seus ataques contra ele ganham +5. Gasta ao usar.' },

  /* ===== PIRATA ===== */
  { id: 'ite_garrafa_folego', nome: 'Garrafa de fôlego', classe: 'pirata', peso: 2,
    descricao: 'Bebida, permite respirar debaixo d\u2019água por uma cena.' },
  { id: 'ite_mapa_incompleto', nome: 'Mapa incompleto', classe: 'pirata', peso: 2,
    descricao: 'Uma vez por sessão, revela um detalhe do lugar onde você está. Não gasta.' },
  { id: 'ite_chave_sem_fechadura', nome: 'Chave sem fechadura', classe: 'pirata', peso: 2,
    descricao: 'Você não sabe o que ela abre. A mestra sabe.' },
  { id: 'ite_barril_polvora', nome: 'Barril pequeno de pólvora', classe: 'pirata', subdivisaoId: 'predileto_mares', peso: 3,
    descricao: 'Causa 6d10 numa área ao explodir. Carregar isso em combate é escolha sua, e a mestra decide quando (ou se vai) explodir.' },
  { id: 'ite_anel_sinete_falso', nome: 'Anel de sinete falso', classe: 'pirata', subdivisaoId: 'trapaceiro', peso: 2,
    descricao: 'Falsifica selos e assinaturas. +5 em testes de Drama envolvendo documentos. Não gasta, mas só pode ser usado uma vez por cena.' },
  { id: 'ite_baralho_marcado', nome: 'Baralho marcado', classe: 'pirata', subdivisaoId: 'trapaceiro', peso: 2,
    descricao: 'Você vence qualquer jogo de azar. Se pegarem, o problema é outro. Não gasta.' },
  { id: 'ite_caixa_pecas_soltas', nome: 'Caixa de peças soltas', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos', peso: 3,
    descricao: 'Sempre tem a peça que falta. +5 em testes de C\u2019est la vie para improvisar. Não gasta.' },

  /* ===== NASCIDO DE OURO ===== */
  { id: 'ite_perfume_corte', nome: 'Frasco de perfume da corte', classe: 'nascido_ouro', peso: 1,
    descricao: 'Cheiro reconhecível a distância. +5 em testes sociais com nobres, −5 para se esconder. Dura a sessão inteira.' },
  { id: 'ite_bolsa_moedas', nome: 'Bolsa de moedas de ouro', classe: 'nascido_ouro', peso: 2,
    descricao: 'Dinheiro suficiente pra comprar quase qualquer coisa em uma cidade pequena.' },
  { id: 'ite_chave_aposentos', nome: 'Chave dos aposentos', classe: 'nascido_ouro', peso: 1,
    descricao: 'Abre qualquer porta de propriedade da coroa, em qualquer cidade. Não gasta.' },
  { id: 'ite_caixa_bobo', nome: 'Caixa do Bobo', classe: 'nascido_ouro', subdivisaoId: 'bobo_corte', peso: 1,
    descricao: 'Role 1d20 e a mestra decide o que sai: pode ser balões, pode ser uma arma devastadora. Pode ser usada uma vez por sessão e não gasta.' },
  { id: 'ite_coroa_menor', nome: 'Coroa menor', classe: 'nascido_ouro', subdivisaoId: 'dono_coroa', peso: 2,
    descricao: 'Usada em público, +5 em testes de Autoridade. Também te torna alvo prioritário se o inimigo falhar em um teste de Volição de DT variável. Não gasta.' },
  { id: 'ite_bandagem_manto', nome: 'Bandagem do próprio manto', classe: 'nascido_ouro', subdivisaoId: 'ensanguentado', peso: 1,
    descricao: 'Você rasga a roupa real pra estancar o sangue de outra pessoa. Recupera 3d6 de vida em um aliado. Gasta ao usar.' },
];

/* Mesmo filtro do resto, com trava extra de nível para itens de mago negro. */
function itemDisponivel(item, char) {
  if (fichaLivre(char)) return false;
  if (item.classe !== char.originId) return false;
  if (item.subdivisaoId && item.subdivisaoId !== char.subdivisaoId) return false;
  if (item.animalTipo && item.animalTipo !== char.subdivisaoAnimalTipo) return false;
  if (item.nivelMin === 'negro' && (char.subdivisaoNivel || 0) < NIVEL_MAX) return false;
  return true;
}
function itemBloqueadoPorNivel(item, char) {
  return item.nivelMin === 'negro' && (char.subdivisaoNivel || 0) < NIVEL_MAX;
}

/* ---------- catálogo de habilidades ----------
   classe: obrigatória. subdivisaoId ou animalTipo: opcionais (restringem mais).
   Sem subdivisaoId/animalTipo = disponível para toda a classe. */
const HABILIDADES_CATALOGO = [
  /* ===== DRUIDA ===== */
  { id: 'hab_raizes_alcancam', nome: 'Onde as raízes alcançam', classe: 'druida',
    descricao: 'Você toca o chão e, com um teste bem-sucedido de Ágape, sente tudo que está vivo num raio determinado pela mestra: pessoas, animais, plantas doentes, corpos recentes. Gasta 9 de sanidade.' },
  { id: 'hab_ninguem_morre_sozinho', nome: 'Ninguém morre sozinho aqui', classe: 'druida',
    descricao: 'Você fica com um moribundo e a natureza segura ele mais um pouco: o aliado não morre até o fim da cena, mesmo em zero de vida. Antes da cena acabar, ele precisa receber tratamentos médicos de alguém treinado em Apotheca, senão ele morre. Gasta 15 de sanidade. Não cura nada, apenas dá uma nova chance. Pode ser usada uma vez por sessão.' },
  { id: 'hab_faco_de_ti_meu_laco', nome: 'Faço de ti meu laço', classe: 'druida', animalTipo: 'natural',
    descricao: 'Tendo escolhido o lado dos animais naturais, você pode interagir com todos os animais das cenas e tentar se enlaçar a eles fazendo um teste de Ágape (DT determinado pela mestra). Ao se enlaçar, você desbloqueia a habilidade de se transformar parcial ou inteiramente no animal enquanto o seu corpo aguentar.' },
  { id: 'hab_metamorfose_natural', nome: 'Metamorfose', classe: 'druida', animalTipo: 'natural',
    descricao: 'Você pode escolher um ou mais animais com quem possui laço para se transformar. Cada ação com este animal toma um pouco de sanidade. Ao se transformar em mais de um animal, você gasta a sanidade multiplicada pela quantidade de animais que está combinando, mas recebe bônus proporcionais. Para ativar essa habilidade você precisa passar em um teste de Savoir-faire com DT determinado pela mestra.' },
  { id: 'hab_eles_te_tiram', nome: 'Eles te tiram de lá', classe: 'druida', animalTipo: 'natural',
    descricao: 'Quando você cai a zero de vida, seus animais-laço te arrastam pra fora da cena e você acorda em segurança, sem saber como. Uma vez por sessão. Custa 1 animal-laço, que não volta.' },
  { id: 'hab_matilha_decide', nome: 'A matilha decide', classe: 'druida', animalTipo: 'natural',
    descricao: 'Seus animais sentem perigo antes de você. No começo de qualquer cena hostil, você age primeiro. Passivo, sem custo.' },
  { id: 'hab_metamorfose_mistico', nome: 'Metamorfose', classe: 'druida', animalTipo: 'mistico',
    descricao: 'Você se conecta ao seu animal místico, e sabe que pode perder a cabeça no processo, porque esse animal dentro de você quer tomar o controle. Toda rodada, você precisará passar por um teste de Eletroquímica (DT que cresce a cada rodada) e, se falhar, o animal tomará conta de você, e seu personagem é entregue à mestra temporariamente, até que algum aliado o tire deste estado. Para tirar, eles precisam passar em um teste de Império interior (DT variável) para te tirar deste estado de Catástrofe.' },
  { id: 'hab_ele_me_contou', nome: 'Ele me contou', classe: 'druida', animalTipo: 'mistico',
    descricao: 'Seu animal místico sussurra algo verdadeiro que você não teria como saber. Gasta 12 de sanidade. A mestra escolhe o que ele conta — e ele sempre pede algo em troca. Você precisa necessariamente estar perto de seu animal.' },
  { id: 'hab_coleira_curta', nome: 'Coleira curta', classe: 'druida', animalTipo: 'mistico',
    descricao: 'Você adia a Catástrofe por 2 rodadas, ignorando os testes de Eletroquímica nesse intervalo. Gasta 18 de sanidade, e o DT do próximo teste sobe em 5.' },

  /* ===== SEREIA / TRITÃO ===== */
  { id: 'hab_chamado_profundezas', nome: 'Chamado das profundezas', classe: 'sereia',
    descricao: 'Uma vez por cena, você chama a água — chuva, maré, um cano estourado, o que houver — e ela vem. A mestra decide o que a água consegue fazer no ambiente. Gasta 12 de sanidade.' },
  { id: 'hab_canto_afogamento', resistencia: 'Resiste com Volição.', nome: 'Canto do afogamento', classe: 'sereia', subdivisaoId: 'sereia',
    descricao: 'Todos que te ouvem resistem com Volição (DT da mestra) ou caminham na sua direção por 1 rodada, esquecendo o que estavam fazendo. Gasta 15 de sanidade.' },
  { id: 'hab_cancao_afogar', resistencia: 'Resiste com Resistência.', nome: 'Canção de Afogar', classe: 'sereia', subdivisaoId: 'sereia',
    descricao: 'O alvo sente água enchendo os pulmões, embora esteja em terra firme. 6d12, e ele perde a próxima ação tossindo. Gasta 6 de sanidade.' },
  { id: 'hab_dois_contra_um', nome: 'Dois Contra Um', classe: 'sereia', subdivisaoId: 'triton',
    descricao: 'Quando ele está cercado por dois ou mais inimigos, cada ataque dele acerta dois alvos de uma vez, não reduzindo dano, mas perde a ação de movimento. Gasta 5 de sanidade.' },
  { id: 'hab_voz_acalma', nome: 'A voz que acalma', classe: 'sereia', subdivisaoId: 'sereia',
    descricao: 'Você remove medo, pânico ou controle mental de um aliado. Gasta 9 de sanidade.' },
  { id: 'hab_nada_disso_real', nome: 'Nada disso é real', classe: 'sereia', subdivisaoId: 'sereia',
    descricao: 'Uma vez por cena, você faz alguém acreditar numa coisa pequena e falsa (que você é outra pessoa, que a porta está trancada). Gasta 12 de sanidade.' },
  { id: 'hab_mare_nao_recua', nome: 'A maré não recua', classe: 'sereia', subdivisaoId: 'triton',
    descricao: 'Enquanto estiver com menos da metade da vida, você recebe +5 em todos os testes de Físico. Passivo, sem custo.' },
  { id: 'hab_puxao_correnteza', resistencia: 'Resiste com Instrumento físico.', nome: 'Puxão de correnteza', classe: 'sereia', subdivisaoId: 'triton',
    descricao: 'Você arrasta um inimigo para perto de você, mesmo a distância. Ele resiste com Instrumento físico (DT da mestra). Gasta 9 de sanidade.' },
  { id: 'hab_folego_emprestado', nome: 'Fôlego emprestado', classe: 'sereia', subdivisaoId: 'triton',
    descricao: 'Você e seus aliados respiram debaixo d\u2019água e se movem nela como em terra firme por uma cena inteira. Gasta 12 de sanidade.' },

  /* ===== MAGO ===== */
  { id: 'hab_emprestimo_tinta', nome: 'Empréstimo de tinta', classe: 'mago',
    descricao: 'Você cede 10 de mana a outro mago, ou puxa 10 dele com o consentimento dele. Gasta 6 de sanidade por transferência.' },
  { id: 'hab_heranca_de_tinta', nome: 'Herança de tinta', classe: 'mago',
    descricao: 'Quando outro mago morre perto de você, você absorve metade da mana que ele tinha. Passivo, sem custo. Ninguém te ensinou isso — simplesmente aconteceu, uma vez, e você não esqueceu.' },
  { id: 'hab_economia_palavras', nome: 'Economia de palavras', classe: 'mago',
    descricao: 'Escolha um feitiço seu no começo da sessão. Ele custa 2 de mana a menos até o fim dela. Passivo, sem custo.' },
  { id: 'hab_segunda_tentativa', nome: 'Segunda tentativa', classe: 'mago',
    descricao: 'Quando um feitiço seu falha ou é resistido, você pode conjurá-lo de novo imediatamente pela metade do custo. Uma vez por cena.' },

  /* ===== GUERREIRO ===== */
  { id: 'hab_plateia_quer_sangue', nome: 'A plateia quer sangue', classe: 'guerreiro',
    descricao: 'Você ignora medo, intimidação e controle mental por 2 rodadas, avançando em linha reta. Gasta 9 de sanidade. Você também não consegue recuar ou mudar de plano nesse intervalo.' },
  { id: 'hab_arena_nunca_sai', nome: 'A arena nunca sai de você', classe: 'guerreiro',
    descricao: 'Você reconhece na hora quem é o mais perigoso de um grupo e quanto dano aquele inimigo ainda aguenta antes de cair. Passivo, sem custo. Foram anos aprendendo a ler quem ia te matar.' },
  { id: 'hab_faca_disso_cicatriz', nome: 'Faça disso uma cicatriz', classe: 'guerreiro', subdivisaoId: 'brutus',
    descricao: 'Sacrifique uma parte do seu corpo à sua escolha (deverá ser aceito pela mestra) e perca metade da sua vida atual para evitar um golpe que seria fatal a um colega. Se você estiver com menos da metade da sua vida ao utilizar esse golpe, você se sacrifica pelo seu aliado, dando a ele uma nova chance de viver. Você pode usar essa habilidade uma vez por cena e pode ser usada fora de sua ação.' },
  { id: 'hab_deixe_me_viver', nome: 'Deixe-me viver um pouco mais', classe: 'guerreiro', subdivisaoId: 'brutus',
    descricao: 'Você prevê que algo horrível pode acontecer a qualquer momento, então precisa se preparar. Antes de uma cena de combate, usa esta habilidade para você e seus aliados receberem 1d10 em testes de Limiar da dor. Você gasta 1d12 de sanidade permanente ao utilizar essa habilidade.' },
  { id: 'hab_corpo_de_aco', nome: 'Corpo de Aço', classe: 'guerreiro', subdivisaoId: 'brutus',
    descricao: 'Você recebe +5 de defesa até o final da cena. Gasta 15 pontos de sanidade.' },
  { id: 'hab_gladiador_sombras', nome: 'Gladiador das Sombras', classe: 'guerreiro', subdivisaoId: 'pritzk',
    descricao: 'Você age melhor quando os outros não te veem. Você recebe +5 em testes de Silêncio até o final da cena. Gasta 6 pontos de sanidade.' },
  { id: 'hab_golpe_nao_viu', nome: 'O golpe que você não viu', classe: 'guerreiro', subdivisaoId: 'pritzk',
    descricao: 'Se você atacar alguém que não sabia da sua presença, o alvo recebe o dobro de dano do ataque. Gasta 9 de sanidade. Não funciona duas vezes na mesma pessoa na mesma cena.' },
  { id: 'hab_eu_ja_sabia', nome: 'Eu já sabia', classe: 'guerreiro', subdivisaoId: 'pritzk',
    descricao: 'Uma vez por cena, você faz um teste de Velocidade de reação com DT igual à Defesa do alvo e anula completamente os efeitos da próxima ação dele. Gasta 12 pontos de sanidade.' },
  { id: 'hab_onde_doi_mais', nome: 'Onde dói mais', classe: 'guerreiro', subdivisaoId: 'nerena',
    descricao: 'Você estuda um alvo por uma rodada inteira sem atacar. No próximo ataque contra ele, o dano é dobrado. Gasta 9 de sanidade.' },
  { id: 'hab_lamina_sabe_caminho', nome: 'A lâmina sabe o caminho', classe: 'guerreiro', subdivisaoId: 'nerena',
    descricao: 'Uma vez por cena, seu ataque ignora completamente defesa, bloqueio e esquiva. Gasta 15 de sanidade.' },
  { id: 'hab_distancia_numero', nome: 'Distância é só um número', classe: 'guerreiro', subdivisaoId: 'nerena',
    descricao: 'Você troca livremente entre alcance corpo a corpo e à distância na mesma ação, sem penalidade. Gasta 6 de sanidade por rodada mantida.' },

  /* ===== PIRATA ===== */
  { id: 'hab_todo_porto_amigo', nome: 'Todo porto tem um amigo', classe: 'pirata',
    descricao: 'Em qualquer cidade portuária, você conhece alguém que te deve favor ou informação. A mestra decide quem e o que essa pessoa pode te oferecer. Gasta 9 de sanidade.' },
  { id: 'hab_ancore_ainda_sorri', nome: 'Ancorê ainda sorri', classe: 'pirata', subdivisaoId: 'predileto_mares',
    descricao: 'Uma vez por cena, você refaz um teste que falhou. Gasta 12 de sanidade.' },
  { id: 'hab_ombro_tempestade', nome: 'Ombro de tempestade', classe: 'pirata', subdivisaoId: 'predileto_mares',
    descricao: 'Você recebe um golpe que iria para um aliado próximo, tomando o dano no lugar dele. Gasta 6 de sanidade.' },
  { id: 'hab_nao_foi_dessa_vez', nome: 'Não foi dessa vez', classe: 'pirata', subdivisaoId: 'predileto_mares',
    descricao: 'Quando sua vida chegaria a zero, você fica com 1 e continua de pé. Uma vez por sessão. Gasta 30 de sanidade.' },
  { id: 'hab_ja_ouviu_falar_de_mim', nome: 'Você já ouviu falar de mim', classe: 'pirata', subdivisaoId: 'trapaceiro',
    descricao: 'Você inventa uma história sobre si mesmo e ela cola. Teste de Drama (DT da mestra); se passar, o alvo trata você conforme a mentira até algo provar o contrário. Gasta 9 de sanidade.' },
  { id: 'hab_braco_esquerdo_ancore', nome: 'Braço esquerdo de Ancorê', classe: 'pirata', subdivisaoId: 'trapaceiro',
    descricao: 'Uma vez por cena, você declara que já esteve nesse lugar antes e conhece uma saída, um atalho ou um segredo dele. A mestra decide qual. Gasta 15 de sanidade.' },
  { id: 'hab_culpa_dele', nome: 'Culpa dele', classe: 'pirata', subdivisaoId: 'trapaceiro',
    descricao: 'Você desvia a atenção de todos para outra pessoa por 1 rodada. Gasta 9 de sanidade.' },
  { id: 'hab_isso_serve', nome: 'Isso serve', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos',
    descricao: 'Você improvisa uma ferramenta com o que tiver em mãos e ela resolve um problema prático específico. Teste de C\u2019est la vie (DT da mestra). Gasta 6 de sanidade.' },
  { id: 'hab_li_a_corrente', nome: 'Eu li a corrente', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos',
    descricao: 'Antes de uma cena de perigo, você prevê um obstáculo e o grupo inteiro recebe +5 no primeiro teste relacionado a ele. Gasta 12 de sanidade.' },
  { id: 'hab_duas_maos_tres_tarefas', nome: 'Duas mãos, três tarefas', classe: 'pirata', subdivisaoId: 'mestre_redemoinhos',
    descricao: 'Por 2 rodadas, você faz duas ações por turno em vez de uma. Gasta 18 de sanidade.' },

  /* ===== NASCIDO DE OURO ===== */
  { id: 'hab_o_nome_pesa', nome: 'O nome pesa', classe: 'nascido_ouro',
    descricao: 'Você diz quem você é e o mundo reage. Em qualquer situação social com quem reconheça a coroa, você recebe +10 no teste. Gasta 6 de sanidade.' },
  { id: 'hab_corte_tem_olhos', nome: 'A corte tem olhos', classe: 'nascido_ouro',
    descricao: 'Você sabe se está sendo seguido, vigiado ou traído, embora nem sempre saiba por quem. Passivo, sem custo. Cresceu assim.' },
  { id: 'hab_ate_impera_riu', nome: 'Até Împera riu', classe: 'nascido_ouro', subdivisaoId: 'bobo_corte',
    descricao: 'Você desarma uma situação tensa com uma piada. Teste de Império interior (DT da mestra); se passar, ninguém ataca por 1 rodada. Gasta 9 de sanidade.' },
  { id: 'hab_ninguem_desconfia_palhaco', nome: 'Ninguém desconfia do palhaço', classe: 'nascido_ouro', subdivisaoId: 'bobo_corte',
    descricao: 'Você passa despercebido em qualquer ambiente social, mesmo hostil. Gasta 6 de sanidade.' },
  { id: 'hab_sou_um_de_voces', nome: 'Sou um de vocês', classe: 'nascido_ouro', subdivisaoId: 'bobo_corte',
    descricao: 'Um aliado recupera 3d10 de sanidade porque você conseguiu fazê-lo rir num momento impossível. Uma vez por cena. Gasta 12 da sua própria sanidade.' },
  { id: 'hab_ajoelhe_se', resistencia: 'Resiste com Volição.', nome: 'Ajoelhe-se', classe: 'nascido_ouro', subdivisaoId: 'dono_coroa',
    descricao: 'Todos que te ouvem resistem com Volição (DT da mestra) ou perdem sua próxima ação. Gasta 18 de sanidade.' },
  { id: 'hab_minha_palavra_lei', nome: 'Minha palavra é lei', classe: 'nascido_ouro', subdivisaoId: 'dono_coroa',
    descricao: 'Você dá uma ordem direta a um aliado e ele recebe +10 no teste para cumpri-la. Gasta 9 de sanidade.' },
  { id: 'hab_impera_em_pessoa', resistencia: 'Resiste com Volição.', nome: 'Împera em pessoa', classe: 'nascido_ouro', subdivisaoId: 'dono_coroa',
    descricao: 'Uma vez por cena, alguém te confunde com Împera e obedece uma única ordem sem questionar. O alvo pode tentar resistir com um teste de Volição, mas a DT é a soma da sua Autoridade com a da ficha de Împera. Gasta 24 de sanidade — sustentar essa imagem custa.' },
  { id: 'hab_pais_protege_corpo', nome: 'Um país se protege com o corpo', classe: 'nascido_ouro', subdivisaoId: 'ensanguentado',
    descricao: 'Enquanto houver aliados feridos na cena, você recebe +5 em todos os testes de combate. Passivo, sem custo.' },
  { id: 'hab_que_membro_familia_real', nome: 'Que membro da família real faz isso?', classe: 'nascido_ouro', subdivisaoId: 'ensanguentado',
    descricao: 'Uma vez por cena, você abre mão de toda a sua defesa nesta rodada e, em troca, seu ataque causa o dobro de dano. Sem custo de sanidade — só de risco.' },
];

/* Uma habilidade está disponível se bate com a classe e, quando houver,
   com a subdivisão ou o tipo de animal-laço do personagem. */
function habilidadeDisponivel(hab, char) {
  if (fichaLivre(char)) return false;
  if (hab.classe !== char.originId) return false;
  if (hab.subdivisaoId && hab.subdivisaoId !== char.subdivisaoId) return false;
  if (hab.animalTipo && hab.animalTipo !== char.subdivisaoAnimalTipo) return false;
  return true;
}

/* Rótulo curto de origem, para exibir no card */
function escopoHabilidade(hab) {
  if (hab.animalTipo) return hab.animalTipo === 'mistico' ? 'animal místico' : 'animal natural';
  if (hab.subdivisaoId) {
    const listas = [...TIPOS_AGUA, ...FAMILIAS_GUERREIRO, ...REPUTACOES_PIRATA, ...CORTE_NASCIDO_OURO];
    return listas.find((x) => x.id === hab.subdivisaoId)?.nome || '';
  }
  return 'toda a classe';
}

/* ---------- catálogo de feitiços dos magos ----------
   nivelMin = nível mágico exigido. 'negro' = exclusivo de magos negros (nível 100). */
const FEITICOS_CATALOGO = [
  { id: 'fei_espirito_incandescente', resistencia: 'Resiste com Resistência, recebendo metade do dano.', nota: 'Para sustentar esse efeito você gasta 4 de mana por rodada e se você receber um ataque enquanto mantém a magia sustentada a DT é de Dicionário mental igual a metade do dano tomado.', nome: 'Espírito incandescente', nivelMin: 5,
    descricao: 'Você produz fogo. É uma quantidade minúscula, sim, mas, se souber usar, pode ser bem útil. Você gasta 1 de mana para acender um dedo de fogo. Causa 1d4 de dano a mais em ataques.',
    evolucoes: [
      'Você produz fogo. É uma quantidade minúscula, sim, mas, se souber usar, pode ser bem útil. Você gasta 1 de mana para acender um dedo de fogo. Causa 1d4 de dano a mais em ataques.',
      'Agora você pode acender uma mão inteira de fogo por 3 de mana. Causa 3d4 a mais em ataques.',
      'Agora você pode acender um braço inteiro de fogo por 5 de mana. Causa 5d4 a mais em ataques.',
    ] },
  { id: 'fei_frenesi', nome: 'Frênesi', nivelMin: 5,
    descricao: 'Você ainda não teve que sobreviver a muitas coisas, então o desespero da batalha te dá 10 de mana em troca de 15 pontos de sanidade.',
    evolucoes: [
      'Você ainda não teve que sobreviver a muitas coisas, então o desespero da batalha te dá 10 de mana em troca de 15 pontos de sanidade.',
      'Agora você pode trocar 20 de sanidade por 15 de mana.',
      'Agora você troca 30 de mana por miseráveis 8 de mana. Essa evolução do feitiço tem uso limitado em 3 vezes por sessão.',
    ] },
  { id: 'fei_deixe_me_vencer', nome: 'Deixe-me vencer desta vez', nivelMin: 10,
    descricao: 'Você pode refazer um teste à sua escolha, jogando novamente seus dados sem nenhuma punição. Gasta 4 de mana.' },
  { id: 'fei_tradicao_recintos', nome: 'Tradição dos recintos amaldiçoados', nivelMin: 15,
    descricao: 'Você conversa com os objetos e as estruturas do lugar em que você está — e elas te contam o que viram e ouviram nas últimas horas. Gasta 3 de mana. Elas não mentem, mas também não entendem muito bem o que viram.',
    evolucoes: [
      'Você conversa com os objetos e as estruturas do lugar em que você está — e elas te contam o que viram e ouviram nas últimas horas. Gasta 3 de mana. Elas não mentem, mas também não entendem muito bem o que viram.',
      'Agora animais pequenos como baratas, ratos e até mesmo formigas falam sua versão da história, à suas maneiras, por 4 de mana.',
      'Objetos, estruturas e animais agora possuem a lucidez de um gênio. Eles te contam as últimas cenas acontecidas à sua frente com clareza, até mesmo sabendo informações como nomes e sentimentos por 10 de mana.',
    ] },
  { id: 'fei_rachadura', resistencia: 'Resiste com Velocidade de reação, recebendo metade do dano.', nome: 'Rachadura', nivelMin: 20,
    descricao: 'Você abre uma fenda fina no chão sob os pés do alvo. Ele resiste com Coordenação motora ou cai e sofre 4d10 de dano. Gasta 4 de mana.',
    evolucoes: [
      'Você abre uma fenda fina no chão sob os pés do alvo. Ele resiste com Coordenação motora ou cai e sofre 4d10 de dano. Gasta 4 de mana.',
      'Você abre uma fenda mais grossa agora. Causa 5d12 de dano e gasta 6 de mana.',
      'Você abre uma cratera, pegando todos os alvos em um raio grande. Aliados também podem ser afetados e a cratera nunca se desfaz. Causa 8d12 de dano e gasta 9 de mana.',
    ] },
  { id: 'fei_costureiro_morte', nome: 'Costureiro da morte', nivelMin: 30,
    descricao: 'Você fecha ferimentos com fios de luz, devolvendo 3d10 de vida a um alvo. Gasta 5 de mana. Não funciona duas vezes na mesma ferida.',
    evolucoes: [
      'Você fecha ferimentos com fios de luz, devolvendo 3d10 de vida a um alvo. Gasta 5 de mana. Não funciona duas vezes na mesma ferida.',
      'Você devolve 5d10 de vida por 7 de mana.',
      'Você devolve 7d12 de vida por 10 de mana.',
    ] },
  { id: 'fei_herdeiro_chamas', resistencia: 'Resiste com Instrumento físico, recebendo metade do dano.', nota: 'Para sustentar esse efeito você gasta 4 de mana por rodada e se você receber um ataque enquanto mantém a magia sustentada a DT é de Dicionário mental igual a metade do dano tomado.', nome: 'Herdeiro de chamas', nivelMin: 35,
    descricao: 'Evolução natural de Espírito incandescente: agora o fogo obedece forma. Você molda uma parede, um caminho ou uma corrente de fogo. Gasta 6 de mana e causa 3d12 + 10 de dano.',
    evolucoes: [
      'Evolução natural de Espírito incandescente: agora o fogo obedece forma. Você molda uma parede, um caminho ou uma corrente de fogo. Gasta 6 de mana e causa 3d12 + 10 de dano.',
      'O fogo te protege. Essa evolução pode ser usada como reação a algum ataque por 8 de mana, colocando fogo no alvo por uma rodada, que recebe 4d10 de dano como reação, mas não te impede de tomar o ataque dele.',
      'Você pode usar essa evolução para pegar fogo em seu corpo inteiro, virando um fogaréu ambulante que bota fogo em tudo que toca. O simples ato de encostar em algo causa 3d20 de dano e gasta 10 de mana.',
    ] },
  { id: 'fei_escudo_totemico', nome: 'Escudo Totêmico', nivelMin: 40,
    descricao: 'Um totem se acende em algum lugar do ambiente e, enquanto ninguém quebrá-lo, você recebe metade de todos os danos. Você gasta 6 de mana e pode usar este escudo em um aliado, sacrificando sua proteção.' },
  { id: 'fei_lorde_metal', resistencia: 'Resiste com Coordenação motora, tomando metade do dano.', nome: 'Lorde Metal', nivelMin: 45,
    descricao: 'Mova todos os objetos de metal no recinto. Você pode usar como arma ou simplesmente mudá-lo de lugar. Você não pode mover objetos maiores do que o tamanho de sua mão, e só pode mover um por vez. Objetos dão 2d10 de dano. Gasta 4 de mana por objeto.',
    evolucoes: [
      'Mova todos os objetos de metal no recinto. Você pode usar como arma ou simplesmente mudá-lo de lugar. Você não pode mover objetos maiores do que o tamanho de sua mão, e só pode mover um por vez. Objetos dão 2d10 de dano. Gasta 4 de mana por objeto.',
      'Você agora move todos os objetos pequenos e médios do recinto, podendo usar todos como arma. A cada 2 objetos, o dano é de 3d12. Cada 1, 2d10. Gasta 6 de mana.',
      'Você agora pode mover todos os objetos do recinto, ignorando seu tamanho, desde que seja feito de metal. Gasta 10 de mana e o dano de objetos considerados grandes ou enormes é de 5d12 de dano.',
    ] },
  { id: 'fei_homunculo', nome: 'Invocando o Homúnculo', nivelMin: 50,
    descricao: 'Você cria 2 aliados de carne para te auxiliar em combates ou testar estruturas perigosas. Você gasta 5 de mana para invocá-los e eles obedecem suas ordens cegamente. Aparências são definidas por você. Eles causam 1d12 de dano e você escolhe quem eles atacam. Cada um tem 10 de vida e te obedecem cegamente.',
    evolucoes: [
      'Você cria 2 aliados de carne para te auxiliar em combates ou testar estruturas perigosas. Você gasta 5 de mana para invocá-los e eles obedecem suas ordens cegamente. Aparências são definidas por você. Eles causam 1d12 de dano e você escolhe quem eles atacam. Cada um tem 10 de vida e te obedecem cegamente.',
      'Você cria 3 aliados agora, um pouco maiores por 7 de mana. Eles causam 2d10 de dano por ataque. Cada um tem 15 de vida e te obedecem cegamente.',
      'Você cria um monstro de carne, sangue e raiva. Ela é quase um brutamonte, causando 4d12 + 10 por ataque por 10 de mana. Ela tem 30 de vida, mas não te obedece muito bem.',
    ] },
  { id: 'fei_erratum', resistencia: 'Resiste com Volição, tomando metade do dano.', nome: 'Erratum', nivelMin: 55,
    descricao: 'Você declara uma condenação curta contra um alvo. Ele sofre 6d12 de dano, e o dobro disso se já estiver ferido. Gasta 6 de mana.' },
  { id: 'fei_pulso_arcano', resistencia: 'Resiste com Resistência, recebendo metade do dano.', nome: 'Pulso Arcano', nivelMin: 60,
    descricao: 'Você leva ondas de choque do chão até seu alvo, que fica imóvel por 1 rodada. Você gasta 6 de mana.',
    evolucoes: [
      'Você leva ondas de choque do chão até seu alvo, que fica imóvel por 1 rodada. Você gasta 6 de mana.',
      'Esse pulso vira um raio agora, deixando marcas de eletricidade em seu corpo. Esse pulso agora dá 3d10 de dano, mas não deixa o alvo imóvel. Gasta 5 de mana.',
      'Você deixa todos os alvos a uma distância média de você imóveis por uma rodada. Gasta 8 de mana.',
    ] },
  { id: 'fei_forjador_mortifero', nome: 'Forjador Mortífero', nivelMin: 65,
    descricao: 'Você amaldiçoa a arma de um aliado seu à sua escolha para conceder 3d10 a mais de dano em todos os ataques com ela. Você gasta 5 de mana por arma amaldiçoada.',
    evolucoes: [
      'Você amaldiçoa a arma de um aliado seu à sua escolha para conceder 3d10 a mais de dano em todos os ataques com ela. Você gasta 5 de mana por arma amaldiçoada.',
      'Você agora pode amaldiçoar armaduras também, podendo tankar 1d12 de dano até o final da cena. Você gasta 6 de mana por armadura amaldiçoada.',
      'Você tira a proteção de uma armadura inimiga, quebrando-a uma vez por cena. Gasta 10 de mana.',
    ] },
  { id: 'fei_equilibrio_sanguineo', nome: 'Equilíbrio sanguíneo', nivelMin: 70,
    descricao: 'Escolha dois alvos e faça com que seus níveis de vida fiquem equilibrados, somando seus pontos e dividindo entre os dois. Você gasta 5 de mana e ambos os alvos podem tentar resistir com um teste de Resistência.' },
  { id: 'fei_fome_karzaron', resistencia: 'Resiste com Velocidade de reação, tomando metade do dano.', nome: 'Fome de Karzaron', nivelMin: 75,
    descricao: 'Uma boca escura se abre atrás do alvo e arranca um pedaço do que ele é. Causa 6d12 de dano, e você recupera metade desse valor em mana. Gasta 15 de mana e 12 de sanidade.',
    evolucoes: [
      'Uma boca escura se abre atrás do alvo e arranca um pedaço do que ele é. Causa 6d12 de dano, e você recupera metade desse valor em mana. Gasta 15 de mana e 12 de sanidade.',
      'Um braço demoníaco inteiro é chamado por você, e ele te protege da metade dos danos tomados por 3 rodadas, também podendo dar ataques que causam 2d12 de dano. Gasta 10 de mana.',
      'Olhos demoníacos surgem no nada — alguns dizem que do inferno — e tira 6d12 de sanidade do alvo. Gasta 6 de mana.',
    ] },
  { id: 'fei_brincando_morcego', nome: 'Brincando de morcego', nivelMin: 80,
    descricao: 'Você fica de cabeça para baixo no ponto mais alto do recinto por 3 rodadas, atacando de cima e recuperando metade do dano causado em vida. Seus ataques são sombras indetectáveis (não podem ser esquivados) que causam 2d10 de dano. Gasta 5 de mana.',
    evolucoes: [
      'Você fica de cabeça para baixo no ponto mais alto do recinto por 3 rodadas, atacando de cima e recuperando metade do dano causado em vida. Seus ataques são sombras indetectáveis (não podem ser esquivados) que causam 2d10 de dano. Gasta 5 de mana.',
      'Agora você está indetectável, mas não seus ataques. Alvos podem desviar, mas os ataques causam 3d12 de dano, e metade do dano volta para você em vida ou sanidade.',
      'Tanto você quanto seus ataques estão indetectáveis por 2 rodadas. Ataques causam 3d10 de dano e não podem ser desviados. Você gasta 12 de mana.',
    ] },
  { id: 'fei_mestre_marionetes', nome: 'Mestre das Marionetes', nivelMin: 85,
    descricao: 'Você se transforma em alguém por 1d20 de minutos, imitando-o perfeitamente (desde sua voz até seus trejeitos), mas não sabe tudo que há dentro da mente daquele que você está copiando. Você gasta mana equivalente aos minutos que permanece sob efeito do feitiço dividido por 2, ou seja, metade dos minutos. A pessoa precisa estar viva para você imitá-la.',
    evolucoes: [
      'Você se transforma em alguém por 1d20 de minutos, imitando-o perfeitamente (desde sua voz até seus trejeitos), mas não sabe tudo que há dentro da mente daquele que você está copiando. Você gasta mana equivalente aos minutos que permanece sob efeito do feitiço dividido por 2, ou seja, metade dos minutos. A pessoa precisa estar viva para você imitá-la.',
      'Você se transforma em uma pessoa viva por 1d20 de horas ao invés de minutos, imitando-a perfeitamente. Você gasta mana equivalente a unidade de horas que você permanece sob efeito do feitiço. A pessoa precisa estar viva para você imitá-la e memórias da pessoa vão surgindo aos poucos, mas não são verossímeis a todo momento. Elas podem te enganar.',
      'As pessoas não precisam estar vivas para você imitá-las, mas você precisa ter visto seu corpo em algum momento da sua vida (o corpo morto, ou a pessoa antes dela morrer). Você determina se quer ficar com o corpo por 1d20 de minutos ou 1d20 de horas, sendo o cálculo de mana gasta equivalente as outras evoluções. Memórias ainda surgem do receptáculo, e elas são verdadeiras, mas só surgem com o uso de horas da marionete, não funciona em minutos.',
    ] },
  { id: 'fei_permita_me_deus', nome: 'Permissão de Mago', nivelMin: 90,
    descricao: 'Um aliado à sua escolha recebe +15 em todos os testes e não pode ser morto ou derrubado por 3 rodadas. Gasta 15 de mana. Se ele usar isso pra matar alguém, você faz um teste de Resistência com DT 20. Se falhar, você também morre.' },
  { id: 'fei_ultimas_palavras', nome: 'Faço disso minhas últimas palavras', nivelMin: 90,
    descricao: 'Você troca a sua vida pela de outra pessoa, em qualquer lugar do mundo, morta ou quase-morta. Custa tudo: sua mana, sua sanidade, seus pontos de vida, e sua marca some da pele. O restante dos personagens nunca saberá seu paradeiro, nem lembrará do seu rosto, apenas a primeira letra do seu nome. O seu personagem sai da história — mas alguém da sua escolha volta.' },
  { id: 'fei_reescrevendo_mapa', nome: 'Reescrevendo o mapa', nivelMin: 95,
    descricao: 'Você move uma coisa grande: um rio, uma montanha, uma rua alguns quilômetros. Gasta 40 de mana e leva uma noite inteira sem ações. Quando amanhecer, o mundo é diferente e ninguém sabe explicar por quê.',
    evolucoes: [
      'Você move uma coisa grande: um rio, uma montanha, uma rua alguns quilômetros. Gasta 40 de mana e leva uma noite inteira sem ações. Quando amanhecer, o mundo é diferente e ninguém sabe explicar por quê.',
      'Você agora move uma cidade inteira por 60 de mana. Você leva um dia e uma noite inteira.',
      'Você move um país inteiro, mudando o mapa mundi à sua mercê. Demora uma semana e gasta 80 de mana.',
    ] },
  { id: 'fei_senhor_quatro_mundos', nome: 'Senhor dos quatro mundos', nivelMin: 'negro',
    descricao: 'Você se teleporta livremente para todos os lugares em que já esteve ou conhece, independente do reino. Cada viagem custa 5 de mana.' },
  { id: 'fei_mestre_ampulheta', nome: 'Mestre da Ampulheta', nivelMin: 'negro',
    descricao: 'Uma vez por cena, você pode parar o tempo e mexer no cenário da luta à sua mercê, trocando pessoas, estruturas e animais de lugar. Você gasta 8 de mana e não há como resistir.' },
  { id: 'fei_tinta_fim', nome: 'Com essa tinta escrevo seu fim', nivelMin: 'negro',
    descricao: 'Você escreve o fim de alguém. O alvo sofre dano igual ao seu nível mágico inteiro, sem resistência possível. Gasta 20 de mana e 45 de sanidade, e você não pode conjurar nenhum outro feitiço nesta cena. Uma vez por sessão.' },
];

/* Um feitiço está liberado se o mago tem nível suficiente. */
function feiticoLiberado(feitico, nivelMagico) {
  if (feitico.nivelMin === 'negro') return nivelMagico >= NIVEL_MAX;
  return nivelMagico >= feitico.nivelMin;
}
function motivoBloqueio(feitico) {
  return feitico.nivelMin === 'negro'
    ? 'Você precisa ser um mago negro para utilizar esse feitiço.'
    : `Você precisa ser nível ${feitico.nivelMin} para utilizar esse feitiço.`;
}

/* ---------- atributos ---------- */
const ATTRS = [
  { key: 'intelecto', nome: 'Intelecto', abrev: 'INT', desc: 'Poder cerebral bruto — o quão inteligente você é.' },
  { key: 'psique', nome: 'Psique', abrev: 'PSI', desc: 'Sensibilidade — o quão emocionalmente inteligente você é.' },
  { key: 'fisico', nome: 'Físico', abrev: 'FIS', desc: 'Musculatura — o quão forte você é.' },
  { key: 'motoras', nome: 'Motoras', abrev: 'MOT', desc: 'Sentidos — o quão ágil você é.' },
];
const abrevAttr = (key) => ATTRS.find((a) => a.key === key)?.abrev || '';
const ATTR_BASE = 1, ATTR_MIN = 0, ATTR_MAX = 5, ATTR_POOL = 4;

/* ---------- perícias ---------- */
const PERICIAS = [
  { id: 'logica', nome: 'Percepção', atributo: 'intelecto', desc: 'Deduza o mundo. Siga seus padrões.',
    detalhe: 'Essa perícia geralmente é utilizada para perceber eventos, sentimentos e mudanças no ambiente ou nas pessoas.' },
  { id: 'dicionario_mental', nome: 'Dicionário mental', atributo: 'intelecto', desc: 'O quão bem você acumula as coisas que você viu/ouviu/pensou no passado.',
    detalhe: 'Essa perícia é geralmente usada como uma ferramenta de bônus narrativo, que pode te dar algumas informações adicionais sobre o acontecimento a depender de fatores como lore.' },
  { id: 'drama', nome: 'Drama', atributo: 'psique', desc: 'Faça do mundo um espetáculo só seu. Minta e saiba quando os outros estão mentindo.',
    detalhe: 'Essa perícia é geralmente utilizada para aumentar uma situação muito pequena, dramatizando-a a ponto das pessoas ao seu redor acreditarem na sua versão, por sua encenação. Você também sabe identificar se o drama de outra pessoa é tão verossímil quanto parece.' },
  { id: 'cest_la_vie', nome: "C'est la vie", atributo: 'intelecto', desc: 'Você é o mestre do improviso.',
    detalhe: 'Essa perícia geralmente é usada em momentos de tensão, como por exemplo arrombar uma porta para sair de uma enrascada. O óbvio é sempre visto, mas uma nova saída pode ser percebida com base no improviso.' },
  { id: 'esprit_de_corps', nome: 'Esprit de Corps', atributo: 'intelecto', desc: 'Conecte-se a cenas passadas, investigue. Solucione o caso.',
    detalhe: 'Você não necessariamente quer ver algo, mas sim entender, solucionar o que pode ter acontecido. A mestra pode te fazer perceber coisas que não podem ser vistas a olho nu.' },
  { id: 'apotheca', nome: 'Apotheca', atributo: 'intelecto', desc: 'Você conhece o corpo humano e sabe o que fazer para que não sucumba.',
    detalhe: 'Essa perícia é geralmente usada para tratar ferimentos, usando artimanhas medicinais.' },
  { id: 'volicao', nome: 'Volição', atributo: 'psique', desc: 'Não se prenda às agarras do mundo. Faça simplesmente porque você quer.',
    detalhe: 'Essa perícia é geralmente usada contra Autoridade, para não obedecer aos outros ou a algo. Fazer o que você quer.' },
  { id: 'imperio_interior', nome: 'Império interior', atributo: 'psique', desc: 'O quão bem você conhece as pessoas ao seu redor? (Ou a si mesmo?)',
    detalhe: 'Essa perícia é parecida com Percepção, mas é utilizada no âmbito social e psicológico. Você sabe quando um amigo próximo está agindo estranho, sabe como você mesmo está se sentindo, quando algo está errado.' },
  { id: 'autoridade', nome: 'Autoridade', atributo: 'intelecto', desc: 'Seja o mestre das marionetes. O mundo te ouve quando você quer.',
    detalhe: 'Essa perícia é geralmente usada para impor coisas, ou fazer as pessoas te obedecerem.' },
  { id: 'controle_demonios', nome: 'Controle seus demônios', atributo: 'psique', desc: 'Talvez você não esteja preparado para quando o pior acontece.',
    detalhe: 'Essa perícia é utilizada em casos de loucura, quando sua sanidade está baixa ou um evento catastrófico acontece bem em frente aos seus olhos. Como você lida com situações de puro estresse e medo.' },
  { id: 'deja_vu', nome: 'Déjà-vu', atributo: 'psique', desc: 'Talvez você já tenha vivido este momento. E talvez essa sensação te dê as respostas que procura.',
    detalhe: 'Essa perícia é parecida com Dicionário mental, mas é mais tática. Com um bom teste de Déjà-vu, e a depender de fatores como lore, talvez seu personagem saiba exatamente como se comportar em um ambiente hostil, ou saiba exatamente como fazer uma tarefa absurdamente anormal.' },
  { id: 'agape', nome: 'Ágape', atributo: 'psique', desc: 'Você ama incondicionalmente. E esse amor vai te salvar um dia.',
    detalhe: 'Assim como os druidas criam laços com animais, o restante das classes usa esse teste para se apegar a pessoas de diversas maneiras. Um bom teste de Ágape pode ir mudando aos poucos a maneira como certo NPC ou personagem age perto de você.' },
  { id: 'limiar_dor', nome: 'Guerra', atributo: 'fisico', desc: 'Eles escolheram te enfrentar, então terão que te machucar mais.',
    detalhe: 'Essa perícia é utilizada em cenas de luta, para acertar alguém corpo a corpo com você. A DT é sempre a defesa do personagem.' },
  { id: 'instrumento_fisico', nome: 'Instrumento físico', atributo: 'fisico', desc: 'Esses músculos são seus, e você fará bom uso deles.',
    detalhe: 'Essa perícia é geralmente usada em testes que dependam da sua força bruta, como por exemplo arrombar uma porta ou abrir uma garrafa muito bem fechada.' },
  { id: 'eletroquimica', nome: 'Eletroquímica', atributo: 'fisico', desc: 'Você quer aquilo que te faz sentir bem, mesmo que talvez isso te custe muito.',
    detalhe: 'Essa perícia é geralmente utilizada para não sucumbir a algo carnal, talvez até mesmo químico, como um vício em drogas. Seu corpo reage diferente do seu cérebro a certos estímulos e é preciso resistir fisicamente a isso.' },
  { id: 'resistencia', nome: 'Resistência', atributo: 'fisico', desc: 'Não deixe o mundo te matar. Você ainda tem uma missão a cumprir.',
    detalhe: 'Essa perícia é geralmente utilizada em lutas ou situações de fôlego, para te manter em pé ou até mesmo acordado.' },
  { id: 'furia_sangue', nome: 'Fúria de sangue', atributo: 'fisico', desc: 'Deixe a fera vencer por um instante. Ela sempre soube lutar melhor que você.',
    detalhe: 'Essa perícia é geralmente utilizada para resistir a uma vontade de matar dentro de você. Seu passado pode influenciar nestes testes, ou pode fazer com que eles apareçam com mais frequência.' },
  { id: 'doenca', nome: 'Doença', atributo: 'fisico', desc: 'Talvez ataques e ferimentos não te derrubem, mas e quanto ao resto?',
    detalhe: 'Essa perícia geralmente é utilizada para resistir a sintomas de doenças, ou para aguentar um ambiente insalubre sem ficar com suas desvantagens.' },
  { id: 'compostura', nome: 'Compostura', atributo: 'motoras', desc: 'Fique na linha. Você não pode deixar que os outros te leiam.',
    detalhe: 'Essa perícia é utilizada para esconder o que você está sentindo, como por exemplo um nervosismo ou uma tristeza.' },
  { id: 'velocidade_reacao', nome: 'Velocidade de reação', atributo: 'motoras', desc: 'É preciso saber quando agir (e rápido).',
    detalhe: 'Essa perícia é utilizada para testes que necessitam de um pensamento rápido para escapar de uma situação que pode te ferir, como um tiro ou uma rachadura no chão.' },
  { id: 'coordenacao_motora', nome: 'Coordenação motora', atributo: 'motoras', desc: 'Esqueça sua força, apenas concentre-se em cada passo.',
    detalhe: 'Essa perícia é geralmente utilizada em testes que dependem de um senso sobre seu próprio corpo, como uma pontaria, dirigir um carro ou pular uma janela sem se quebrar todo.' },
  { id: 'savoir_faire', nome: 'Savoir-faire', atributo: 'motoras', desc: 'Controle seu corpo. Faça isso como ninguém.',
    detalhe: 'Essa perícia diz o quão bem você faz aquilo que você sabe fazer. Por exemplo, como um carpinteiro faz um móvel, ou com que velocidade um corredor corre. Essa perícia também pode te fazer aprender coisas novas sem nunca ter tido contato com aquilo antes.' },
  { id: 'silencio', nome: 'Silêncio', atributo: 'motoras', desc: 'Você sabe se esconder nas sombras.',
    detalhe: 'Essa perícia geralmente é utilizada para fazer com que o personagem se esconda, talvez para um ataque furtivo ou para ouvir algo sem ninguém te perceber no ambiente.' },
];

/* ---------- graus de treinamento ---------- */
const TIERS = [
  { id: 0, nome: 'Destreinado', bonus: 0, abrev: 'DES' },
  { id: 1, nome: 'Treinado', bonus: 2, abrev: 'TRE' },
  { id: 2, nome: 'Veterano', bonus: 4, abrev: 'VET' },
  { id: 3, nome: 'Expert', bonus: 6, abrev: 'EXP' },
];

/* Junta todas as perícias que o personagem ganha de graça pela classe + subdivisão */
function periciasConcedidas(char) {
  // Fichas da mestra não herdam perícia nenhuma: as 23 ficam livres.
  if (fichaLivre(char)) return new Set();
  const out = new Set(PERICIAS_POR_CLASSE[char.originId] || []);
  const listas = [...TIPOS_AGUA, ...FAMILIAS_GUERREIRO, ...REPUTACOES_PIRATA, ...CORTE_NASCIDO_OURO];
  const sub = listas.find((x) => x.id === char.subdivisaoId);
  (sub?.pericias || []).forEach((p) => out.add(p));
  return out;
}

/* Grau efetivo: nunca abaixo de Treinado se a perícia foi concedida */
function grauDaPericia(char, periciaId) {
  const escolhido = char.pericias?.[periciaId] ?? 0;
  const concedida = periciasConcedidas(char).has(periciaId);
  return concedida ? Math.max(1, escolhido) : escolhido;
}

/* O bônus da perícia em si é treino + outros. Ele é usado no Bloqueio, que vale
   exatamente o bônus de Resistência, por isso NÃO inclui o atributo aqui.
   Para rolar um teste, some ainda o atributo — ver modificadorDoTeste. */
function bonusDaPericia(char, pericia) {
  const grau = grauDaPericia(char, pericia.id);
  const attrVal = char.attributes?.[pericia.atributo] ?? 0;
  const outros = char.periciasOutros?.[pericia.id] ?? 0;
  return { grau, treino: TIERS[grau].bonus, atributo: attrVal, outros, total: TIERS[grau].bonus + outros };
}

/* ---------- rolagem de teste ----------
   Um d20, somando o atributo da perícia e o bônus dela (treino + outros).
   O total abaixo é exatamente o que o jogador adiciona ao dado. */
function modificadorDoTeste(char, pericia) {
  const b = bonusDaPericia(char, pericia);
  const atributo = char.attributes?.[pericia.atributo] ?? 0;
  return { atributo, treino: b.treino, outros: b.outros, total: atributo + b.total };
}

/* Texto curto que explica de onde saiu o modificador, para o histórico. */
function detalheDoTeste(pericia, m) {
  const partes = [`${abrevAttr(pericia.atributo)} ${m.atributo >= 0 ? '+' : ''}${m.atributo}`];
  if (m.treino) partes.push(`treino +${m.treino}`);
  if (m.outros) partes.push(`outros ${m.outros >= 0 ? '+' : ''}${m.outros}`);
  return partes.join(' · ');
}

function nomesPericias(ids) {
  return ids.map((id) => PERICIAS.find((p) => p.id === id)?.nome).filter(Boolean);
}

/* ---------- defesa, bloqueio e esquiva (estrutura do CRIS) ----------
   Defesa  = 10 + Motoras + equipamento + outros  (valor passivo)
   Bloqueio = bônus de Resistência + equipamento + outros
   Esquiva  = 10 + Motoras + treino de Velocidade de reação + equipamento + outros

   O Bloqueio é o único sem base 10 e sem atributo: ele vale exatamente o que a
   perícia Resistência somar. Quem tem +5 de Resistência bloqueia 5. */
const PERICIA_BLOQUEIO = 'resistencia';
const PERICIA_ESQUIVA = 'velocidade_reacao';

function computeDefesas(char, armadurasCustom = []) {
  const d = char.defesas || {};
  const motoras = char.attributes?.motoras ?? 0;
  const equip = (d.equipamento || 0) + bonusArmadura(char, armadurasCustom);

  const periciaResistencia = PERICIAS.find((p) => p.id === PERICIA_BLOQUEIO);
  const bonusResistencia = periciaResistencia ? bonusDaPericia(char, periciaResistencia).total : 0;
  const treinoEsquiva = TIERS[grauDaPericia(char, PERICIA_ESQUIVA)].bonus;

  return {
    equipamento: equip,
    defesa: 10 + motoras + equip + (d.defesaOutros || 0),
    defesaPartes: { base: 10, atributo: motoras, equip, outros: d.defesaOutros || 0 },
    bloqueio: bonusResistencia + equip + (d.bloqueioOutros || 0),
    bloqueioPartes: { base: 0, atributo: 0, resistencia: bonusResistencia, equip, outros: d.bloqueioOutros || 0 },
    esquiva: 10 + motoras + treinoEsquiva + equip + (d.esquivaOutros || 0),
    esquivaPartes: { base: 10, atributo: motoras, treino: treinoEsquiva, equip, outros: d.esquivaOutros || 0 },
  };
}

/* ---------- helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* Valores atuais das barras. null = cheio (usa o máximo).
   Pode passar do máximo — feitiços e itens concedem pontos temporários. */
function valorAtual(char, tipo, max) {
  const v = char.atual?.[tipo];
  return v === undefined || v === null ? max : Math.max(0, v);
}

function mixHex(hexA, hexB, t) {
  const a = hexA.replace('#', ''), b = hexB.replace('#', '');
  const ar = parseInt(a.slice(0, 2), 16), ag = parseInt(a.slice(2, 4), 16), ab = parseInt(a.slice(4, 6), 16);
  const br = parseInt(b.slice(0, 2), 16), bg = parseInt(b.slice(2, 4), 16), bb = parseInt(b.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((n) => clamp(n, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}
function markColor(origin, char) {
  if (!origin) return V.brand;
  if (origin.id === 'mago') {
    const t = clamp(((char?.subdivisaoNivel || NIVEL_MIN) - NIVEL_MIN) / (NIVEL_MAX - NIVEL_MIN), 0, 1);
    return mixHex('#8FB4F5', '#0E0F17', t);
  }
  return origin.cor;
}
function computeRecursos(char) {
  /* Ficha da mestra ignora as fórmulas: cada máximo nasce em 0 e é digitado
     na mão, sem teto. A mana existe sempre, mesmo sem classe de mago. */
  if (fichaLivre(char)) {
    const r = char.recursosLivres || {};
    return {
      vidaMax: Math.max(0, Number(r.vidaMax) || 0),
      sanidadeMax: Math.max(0, Number(r.sanidadeMax) || 0),
      manaMax: Math.max(0, Number(r.manaMax) || 0),
      vidaNivel: 0, sanidadeNivel: 0,
    };
  }
  const nivelMagico = char.originId === 'mago' ? (char.subdivisaoNivel || NIVEL_MIN) : 0;
  /* O nível mágico dá um ganho extra: até +12 de vida e +15 de sanidade no nível 100. */
  const vidaNivel = Math.floor(nivelMagico / 25) * 3;
  const sanidadeNivel = Math.floor(nivelMagico / 20) * 3;

  const nivel = nivelDaFicha(char);
  const classe = BALANCO_CLASSE[char.originId] || BALANCO_PADRAO;
  const sub = balancoSubdivisao(char);
  /* Cada nível acima do primeiro soma o ganho da classe. */
  const degraus = nivel - NIVEL_CLASSE_MIN;

  const vidaClasse = classe.vidaBase + classe.vidaPorNivel * degraus;
  const vidaBonusLore = char.recursos?.vidaBonusLore || 0;
  const vidaMax = vidaClasse + sub.vida + (char.attributes.fisico * 12) + vidaNivel + vidaBonusLore;

  const sanClasse = classe.sanBase + classe.sanPorNivel * degraus;
  const sanBonus = char.recursos?.sanidadeBonusLore || 0;
  const sanidadeMax = sanClasse + sub.sanidade + (char.attributes.psique * 12) + sanidadeNivel + sanBonus;

  /* Mana só existe para o mago: o nível mágico enche o reservatório e o nível
     de classe dá um reforço. Ela só é gasta ao conjurar rituais. */
  const manaMax = char.originId === 'mago' ? nivelMagico + 2 * nivel : null;

  return {
    vidaMax, sanidadeMax, manaMax, vidaNivel, sanidadeNivel,
    nivel, vidaClasse, sanClasse, subVida: sub.vida, subSanidade: sub.sanidade,
  };
}

/* ---------- pontos que o nível concede ----------
   Atributos: 4 pontos no nível 1, +1 por nível (13 no nível 10).
   Perícias: 4 degraus no nível 1, +2 por nível (22 no nível 10). Um degrau é
   subir uma perícia um grau; as perícias dadas pela classe já vêm no Treinado
   e não consomem nada. */
const pontosDeAtributo = (char) => 3 + nivelDaFicha(char);
const degrausDePericia = (char) => 4 + 2 * (nivelDaFicha(char) - NIVEL_CLASSE_MIN);

function degrausGastos(char) {
  const concedidas = periciasConcedidas(char);
  return PERICIAS.reduce((soma, p) => {
    const grau = grauDaPericia(char, p.id);
    return soma + Math.max(0, grau - (concedidas.has(p.id) ? 1 : 0));
  }, 0);
}

/* ---------- feitiços do mago ----------
   Começa com 2 vagas e ganha 1 a cada 10 níveis mágicos (12 no nível 100).
   Cada feitiço custa vagas conforme a evolução escolhida: 1, 2 ou 3. */
const vagasDeFeitico = (char) => 2 + Math.floor((char?.subdivisaoNivel || NIVEL_MIN) / 10);
const feiticoId = (f) => (typeof f === 'string' ? f : f?.id);
const feiticoEvolucao = (f) => (typeof f === 'string' ? 1 : clamp(Number(f?.evolucao) || 1, 1, 3));
const idsDeFeiticos = (lista) => (lista || []).map(feiticoId).filter(Boolean);
const vagasGastas = (lista) => (lista || []).reduce((s, f) => s + feiticoEvolucao(f), 0);
const detalhesDeFeiticos = (lista) =>
  (lista || []).reduce((mapa, f) => {
    const id = feiticoId(f);
    if (id) mapa[id] = `evolução ${'I'.repeat(feiticoEvolucao(f))}`;
    return mapa;
  }, {});

/* Nem todo feitiço evolui. Quem não evolui não mostra seletor, vale sempre uma
   vaga e ganha um aviso no fim da descrição. */
const AVISO_SEM_EVOLUCAO = 'Esse feitiço não tem evoluções disponíveis.';
const temEvolucoes = (f) => Array.isArray(f?.evolucoes) && f.evolucoes.length === 3;

/* Na ficha, o feitiço é descrito pela evolução que o mago escolheu. */
function descricoesDeFeiticos(lista, catalogo) {
  return (lista || []).reduce((mapa, f) => {
    const id = feiticoId(f);
    const item = (catalogo || []).find((x) => x.id === id);
    if (!id || !item) return mapa;
    mapa[id] = temEvolucoes(item)
      ? item.evolucoes[feiticoEvolucao(f) - 1]
      : `${item.descricao} ${AVISO_SEM_EVOLUCAO}`;
    return mapa;
  }, {});
}

/* Armazenamento no servidor. Personagens e conteúdos vivem numa tabela
   chave/valor no Postgres; a sessão é um cookie httpOnly, então toda
   requisição precisa de credentials: 'include'. Quem manda no que cada
   agente pode ler ou gravar é o servidor, não estas funções. */
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* resposta sem corpo */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'Falha na comunicação com o servidor.');
    err.status = res.status;
    throw err;
  }
  return data;
}

async function sGet(key) {
  try {
    const r = await api(`/kv/${key.split('/').map(encodeURIComponent).join('/')}`);
    return r ? r.value : null;
  } catch (e) { return null; }
}
async function sSet(key, value) {
  try {
    await api(`/kv/${key.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    return true;
  } catch (e) { return false; }
}
async function sDel(key) {
  try {
    await api(`/kv/${key.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE' });
    return true;
  } catch (e) { return false; }
}
async function sList(prefix) {
  try {
    const r = await api(`/kv?prefix=${encodeURIComponent(prefix || '')}`);
    return (r && r.keys) || [];
  } catch (e) { return []; }
}

/* ---------- rolagens ----------
   O servidor é quem rola: o cliente manda a fórmula e recebe o resultado. */
async function rolarNoServidor({ qtd, faces, modificador = 0, categoria, rotulo, detalhe, char }) {
  return api('/rolls', {
    method: 'POST',
    body: JSON.stringify({
      qtd, faces, modificador, categoria, rotulo, detalhe,
      charId: char?.id || null,
      charName: char?.name || null,
    }),
  });
}

async function lerRolagens() {
  try {
    const r = await api('/rolls');
    return (r && r.rolagens) || [];
  } catch (e) { return []; }
}

/* Lê a primeira notação NdM de um texto de dano, junto de um "+N" se houver.
   Os catálogos escrevem coisas como "3d12 + 10", "6d12" ou
   "3d6 (6d6 na água)" — nesse último caso fica a primeira, e a mestra decide
   o resto. Devolve null quando não há dado nenhum para rolar. */
function lerNotacao(texto) {
  if (!texto) return null;
  const m = String(texto).match(/(\d{1,2})\s*d\s*(\d{1,3})\s*(?:([+-])\s*(\d{1,3}))?/i);
  if (!m) return null;
  const qtd = Number(m[1]);
  const faces = Number(m[2]);
  if (!qtd || !faces) return null;
  const modificador = m[3] ? (m[3] === '-' ? -Number(m[4]) : Number(m[4])) : 0;
  return { qtd, faces, modificador, texto: `${qtd}d${faces}${modificador ? ` ${modificador > 0 ? '+' : '−'} ${Math.abs(modificador)}` : ''}` };
}

/* ---------- conteúdo criado pela mestra ----------
   Cada item vive sob o escopo da ficha em que nasceu:

     content:<escopo>:<tipo>:<id>     escopo = jogador | deus | inimigo | especial

   É isso que impede o feitiço de um deus de aparecer na lista de um mago.
   O servidor reforça a regra: quem não é mestra não lê os escopos de mestra.

   As chaves antigas (content:<tipo>:<id>, sem escopo) continuam sendo lidas,
   mas só para resolver o nome do que já está preso em alguma ficha — elas não
   são mais oferecidas em lista nenhuma, porque não dá para saber de que ficha
   vieram. Como o prefixo antigo não colide com o novo, os dois convivem. */
const CAMPOS_CONTEUDO = { arma: 'armas', armadura: 'armaduras', feitico: 'feiticos', habilidade: 'habilidades' };
const TIPOS_CONTEUDO = Object.keys(CAMPOS_CONTEUDO);
const conteudoVazio = () => ({ armas: [], armaduras: [], feiticos: [], habilidades: [], legado: { armas: [], armaduras: [], feiticos: [], habilidades: [] } });

async function lerConteudo(prefixo) {
  const keys = await sList(prefixo);
  const out = [];
  for (const k of keys) {
    const raw = await sGet(k);
    if (raw) { try { out.push(JSON.parse(raw)); } catch (e) { /* item corrompido, ignora */ } }
  }
  return out;
}

async function carregarConteudo(escopo) {
  const [doEscopo, legado] = await Promise.all([
    Promise.all(TIPOS_CONTEUDO.map((t) => lerConteudo(`content:${escopo}:${t}:`))),
    Promise.all(TIPOS_CONTEUDO.map((t) => lerConteudo(`content:${t}:`))),
  ]);
  const index = conteudoVazio();
  TIPOS_CONTEUDO.forEach((t, i) => {
    index[CAMPOS_CONTEUDO[t]] = doEscopo[i];
    index.legado[CAMPOS_CONTEUDO[t]] = legado[i];
  });
  return index;
}

/* ---------- conteúdo próprio da ficha ----------
   Armas, armaduras e habilidades criadas de dentro de uma ficha ficam guardadas
   nela mesma, em char.custom, e não em lugar nenhum compartilhado. É o que
   permite o jogador inventar as próprias sem que isso apareça para os outros.
   Feitiço não entra aqui: continua vindo do catálogo da mestra. */
const customDaFicha = (char, campo) => char?.custom?.[campo] || [];
const CAMPO_CUSTOM = { arma: 'armas', armadura: 'armaduras', habilidade: 'habilidades' };

function montarConteudo(data, escopo) {
  const id = uid();
  return {
    id,
    item: {
      id, nome: data.nome, descricao: data.descricao, dano: data.dano, teste: data.teste,
      defesa: data.defesa, peso: data.peso || 0, escopo, createdAt: Date.now(),
    },
  };
}

/* Guarda o item dentro da própria ficha e já o deixa equipado: armadura é uma
   só, então vai para armaduraId; as outras entram na lista correspondente. */
function guardarCustom(ficha, campo, item, campoLista) {
  const custom = { ...(ficha.custom || {}), [campo]: [...(ficha.custom?.[campo] || []), item] };
  if (!campoLista) return { ...ficha, custom, armaduraId: item.id };
  return { ...ficha, custom, [campoLista]: [...(ficha[campoLista] || []), item.id] };
}

/* Catálogo de exibição: precisa resolver tudo que a ficha referencia — o
   catálogo do jogo, o conteúdo da mestra, os itens antigos sem escopo e o que
   a própria ficha criou. */
function catalogoDe(contentIndex, campo, base = [], char = null) {
  return [
    ...base,
    ...(contentIndex?.[campo] || []),
    ...(contentIndex?.legado?.[campo] || []),
    ...customDaFicha(char, campo),
  ];
}

/* Lista dos seletores: o conteúdo do escopo da ficha, mais os itens antigos.

   Os antigos não têm escopo, então não dá para saber a que ficha pertenciam.
   A mestra continua enxergando todos eles (senão perderia o que já criou antes
   desta separação); para o jogador só aparecem os que já estão presos na ficha
   dele, para que ele consiga vê-los e a mestra consiga removê-los. */
function customsDe(contentIndex, campo, idsPresos = [], ehMestra = false, char = null) {
  const antigos = contentIndex?.legado?.[campo] || [];
  const visiveis = ehMestra ? antigos : antigos.filter((x) => idsPresos.includes(x.id));
  return [...(contentIndex?.[campo] || []), ...visiveis, ...customDaFicha(char, campo)];
}

function resizeImage(file, maxDim = 360, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('img failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   Peças visuais pequenas
   ============================================================ */

function Sigil({ size = 96, glow = true }) {
  const segs = [
    { d: 'M100,100 L100,20 L169.28,60 Z', c: '#D4AF37' },
    { d: 'M100,100 L169.28,60 L169.28,140 Z', c: '#3B6FE0' },
    { d: 'M100,100 L169.28,140 L100,180 Z', c: '#2FB6C4' },
    { d: 'M100,100 L100,180 L30.72,140 Z', c: '#7A2038' },
    { d: 'M100,100 L30.72,140 L30.72,60 Z', c: '#3E8E5B' },
    { d: 'M100,100 L30.72,60 L100,20 Z', c: '#D89A78' },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <filter id="sigilGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g opacity="0.92" filter={glow ? 'url(#sigilGlow)' : undefined}>
        {segs.map((s, i) => <path key={i} d={s.d} fill={s.c} stroke="#0d0a16" strokeWidth="2" opacity="0.85" />)}
      </g>
      <circle cx="100" cy="100" r="16" fill="#7c5cff" filter={glow ? 'url(#sigilGlow)' : undefined} />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#463a6e" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

function ProgressBar({ value, max, color, label }) {
  const excedente = Math.max(0, value - max);
  const pct = max ? clamp((Math.min(value, max) / max) * 100, 0, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs tracking-wide" style={{ color: '#a89bc9', fontFamily: F.body }}>{label}</span>
        <span className="text-xs" style={{ color: excedente ? '#9BDCB4' : '#f1ecff', fontFamily: F.mono }}>
          {value}/{max}{excedente ? ` (+${excedente})` : ''}
        </span>
      </div>
      <div className="h-2 rounded-full w-full relative overflow-hidden" style={{ background: '#231a3d' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        {excedente > 0 && (
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'repeating-linear-gradient(45deg, rgba(155,220,180,0.55) 0 5px, transparent 5px 10px)' }} />
        )}
      </div>
    </div>
  );
}

/* Barra ajustável no estilo do CRIS: « ‹ 53/83 › » com passos de 1 e 10. */
function BarraAjustavel({ label, atual, max, color, onChange }) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(String(atual));
  const excedente = Math.max(0, atual - max);
  const pct = max ? clamp((Math.min(atual, max) / max) * 100, 0, 100) : 0;

  const ajustar = (delta) => onChange(Math.max(0, atual + delta));
  const confirmar = () => {
    const n = parseInt(rascunho, 10);
    if (!Number.isNaN(n)) onChange(Math.max(0, n));
    setEditando(false);
  };

  const Btn = ({ children, onClick, title }) => (
    <button onClick={onClick} title={title}
      className="w-6 h-6 rounded flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
      style={{ background: '#231a3d', color: V.muted, fontFamily: F.mono, fontSize: '11px' }}>
      {children}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs tracking-wide" style={{ color: V.muted, fontFamily: F.body }}>{label}</span>
        {editando ? (
          <input autoFocus value={rascunho} onChange={(e) => setRascunho(e.target.value)}
            onBlur={confirmar} onKeyDown={(e) => e.key === 'Enter' && confirmar()}
            className="w-16 text-xs text-right rounded px-1 py-0.5 outline-none"
            style={{ ...inputStyle, fontFamily: F.mono }} />
        ) : (
          <button onClick={() => { setRascunho(String(atual)); setEditando(true); }}
            className="text-xs" style={{ color: excedente ? '#9BDCB4' : V.text, fontFamily: F.mono }}>
            {atual}/{max}{excedente ? ` (+${excedente})` : ''}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Btn onClick={() => ajustar(-10)} title="−10">«</Btn>
        <Btn onClick={() => ajustar(-1)} title="−1">‹</Btn>
        <div className="flex-1 h-2.5 rounded-full relative overflow-hidden" style={{ background: '#231a3d' }}>
          <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          {excedente > 0 && (
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: 'repeating-linear-gradient(45deg, rgba(155,220,180,0.55) 0 5px, transparent 5px 10px)' }} />
          )}
        </div>
        <Btn onClick={() => ajustar(1)} title="+1">›</Btn>
        <Btn onClick={() => ajustar(10)} title="+10">»</Btn>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#a89bc9', fontFamily: F.body }}>{label}</span>
      {children}
      {hint && <span className="block text-xs mt-1" style={{ color: '#6f6291', fontFamily: F.body }}>{hint}</span>}
    </label>
  );
}
const inputStyle = { fontFamily: F.body, background: '#171029', border: '1px solid #332a52', color: '#f1ecff' };

/* ============================================================
   Autenticação
   ============================================================ */

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const u = username.trim();
    if (u.length < 3) return setError('O nome do agente precisa de pelo menos 3 caracteres.');
    if (password.length < 4) return setError('A senha precisa de pelo menos 4 caracteres.');
    setLoading(true);
    try {
      // O servidor valida a senha, decide quem é mestre e devolve a conta
      // já sem o hash — o cookie de sessão vem junto na resposta.
      const account = await api(`/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify({ username: u, password }),
      });
      onAuth(account);
    } catch (err) { setError(err.message || 'Algo deu errado. Tenta de novo.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" style={{ background: V.bg }}>
      <style>{FONTS}</style>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 20%, rgba(124,92,255,0.16), transparent 60%)' }} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Sigil size={84} />
          <h1 className="mt-4 text-3xl tracking-widest" style={{ fontFamily: F.display, color: V.text, fontWeight: 700 }}>TERARPEQÁ</h1>
          <p className="text-xs mt-1 uppercase" style={{ letterSpacing: '0.2em', color: V.muted, fontFamily: F.body }}>Fichas &amp; Criação de Personagens</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: V.surface, border: `1px solid ${V.border}` }}>
          <div className="flex mb-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${V.border}` }}>
            {['login', 'signup'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} className="flex-1 py-2 text-sm transition-colors"
                style={{ fontFamily: F.body, background: mode === m ? V.brand : 'transparent', color: mode === m ? '#fff' : V.muted }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <Field label="Nome do agente">
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500"
                style={inputStyle} placeholder="ex: cronista_das_marcas" autoComplete="username" />
            </Field>
            <Field label="Senha">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500"
                style={inputStyle} placeholder="••••••••" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </Field>
            {error && (
              <div className="flex items-start gap-2 text-sm mb-4 rounded-lg px-3 py-2" style={{ background: '#2a1622', color: '#f5a3b8', fontFamily: F.body }}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-2.5 flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: V.brand, color: '#fff', fontFamily: F.body, fontWeight: 600 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
        <p className="text-xs text-center mt-5 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
          Suas fichas ficam salvas no servidor e só você (e a conta mestra)
          enxerga as suas. A primeira conta criada vira a conta mestra
          automaticamente.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard (preto e cinza)
   ============================================================ */

function CharacterCard({ char, onOpen, showOwner }) {
  const origin = originDaFicha(char);
  const der = computeRecursos(char);
  return (
    <button onClick={() => onOpen(char)} className="text-left rounded-xl p-4 transition-transform hover:-translate-y-0.5 w-full"
      style={{ background: G.surface, border: `1px solid ${G.border}` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: `${origin.cor}22`, border: `1px solid ${origin.cor}88` }}>
          {char.fotoUrl ? <img src={char.fotoUrl} alt="" className="w-full h-full object-cover" /> : (origin.Icon ? <origin.Icon size={18} color={origin.cor} /> : null)}
        </div>
        <div className="min-w-0">
          <p className="truncate" style={{ fontFamily: F.display, color: G.text, fontWeight: 700 }}>{char.name || 'Sem nome'}</p>
          <p className="text-xs" style={{ color: origin.cor, fontFamily: F.body }}>
            {(() => {
              const tipo = tipoMestre(char);
              /* No especial mostramos o tipo e a classe escolhida. */
              if (tipo) return tipo.escolheClasse && char.originId ? `${tipo.nome} · ${origin.nome}` : tipo.nome;
              return `${origin.nome} · ${origin.deus}`;
            })()}
            {showOwner ? ` · @${char.owner}` : ''}
          </p>
        </div>
      </div>
      <ProgressBar value={valorAtual(char, 'vida', der.vidaMax)} max={der.vidaMax} color="#e0577a" label="Vida" />
    </button>
  );
}

/* Tela de dicionários: um índice à esquerda e o texto corrido à direita. */
function DicionariosScreen({ onBack, inicial }) {
  const [ativo, setAtivo] = useState(inicial || 'geral');
  const doc = DICIONARIOS.find((d) => d.id === ativo) || DICIONARIOS[0];
  const origem = ORIGINS.find((o) => o.id === doc.classeId);
  const cor = origem?.cor || G.accent;

  return (
    <div className="min-h-screen w-full" style={{ background: G.bg }}>
      <style>{FONTS}</style>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-80" style={{ color: G.muted, fontFamily: F.body }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* índice */}
          <div className="sm:w-52 shrink-0">
            <p className="text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: G.muted, fontFamily: F.body }}>
              <BookOpen size={12} /> Dicionários
            </p>
            <div className="flex sm:flex-col gap-2 overflow-x-auto pb-2 sm:pb-0">
              {DICIONARIOS.map((d) => {
                const o = ORIGINS.find((x) => x.id === d.classeId);
                const c = o?.cor || G.accent;
                const sel = ativo === d.id;
                return (
                  <button key={d.id} onClick={() => setAtivo(d.id)}
                    className="text-left rounded-lg px-3 py-2 shrink-0 transition-colors"
                    style={{
                      background: sel ? `${c}1f` : 'transparent',
                      border: `1px solid ${sel ? c : G.border}`,
                      minWidth: '9rem',
                    }}>
                    <p className="text-sm whitespace-nowrap" style={{ fontFamily: F.body, color: sel ? G.text : G.muted, fontWeight: sel ? 600 : 400 }}>
                      {d.classeId ? (o?.nome || d.titulo) : 'Universo'}
                    </p>
                    {d.subtitulo && (
                      <p className="text-xs whitespace-nowrap" style={{ fontFamily: F.body, color: sel ? c : '#6f6f78' }}>{d.subtitulo}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* texto */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl p-5 sm:p-7" style={{ background: G.surface, border: `1px solid ${G.border}` }}>
              <div className="flex items-center gap-3 mb-1">
                {origem ? (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${cor}22`, border: `1px solid ${cor}88` }}>
                    <origem.Icon size={19} color={cor} />
                  </div>
                ) : (
                  <Sigil size={40} glow={false} />
                )}
                <div>
                  <h2 style={{ fontFamily: F.display, color: G.text, fontWeight: 700, fontSize: '1.35rem', lineHeight: 1.2 }}>{doc.titulo}</h2>
                  {doc.subtitulo && <p className="text-xs" style={{ fontFamily: F.body, color: cor }}>{doc.subtitulo}</p>}
                </div>
              </div>

              <div className="mt-6">
                {doc.secoes.map((sec) => (
                  <section key={sec.titulo} className="mb-7">
                    <h3 className="mb-2 pb-1.5 border-b" style={{
                      fontFamily: F.display, color: G.text, fontWeight: 700,
                      fontSize: '1.05rem', borderColor: `${cor}55`,
                    }}>{sec.titulo}</h3>
                    {sec.paragrafos.map((par, i) => (
                      <p key={i} className="text-sm mb-3" style={{ fontFamily: F.body, color: '#d5d5da', lineHeight: 1.75 }}>{par}</p>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ account, characters, loading, onNew, onOpen, onLogout, onDicionarios }) {
  /* A mestra ganha uma aba por tipo de ficha; os jogadores nem veem isso. */
  const [aba, setAba] = useState('jogadores');
  const abaAtiva = account.isMaster ? aba : 'jogadores';
  const tipoAtivo = TIPOS_MESTRE.find((t) => t.id === abaAtiva) || null;
  const visiveis = characters.filter((c) => (c.tipoFicha || 'jogadores') === (tipoAtivo ? tipoAtivo.id : 'jogadores'));
  const corAba = tipoAtivo ? tipoAtivo.cor : G.accent;

  return (
    <div className="min-h-screen w-full" style={{ background: G.bg }}>
      <style>{FONTS}</style>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sigil size={38} glow={false} />
            <div>
              <p style={{ fontFamily: F.display, color: G.text, fontWeight: 700, letterSpacing: '0.05em' }}>TERARPEQÁ</p>
              <p className="text-xs flex items-center gap-1.5" style={{ color: G.muted, fontFamily: F.body }}>
                {account.username}{account.isMaster && (
                  <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5" style={{ background: '#332a52', color: '#d9c3f7' }}>
                    <Settings size={10} /> mestra
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDicionarios} className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
              style={{ color: G.muted, fontFamily: F.body, border: `1px solid ${G.border}` }}>
              <BookOpen size={14} /> Dicionários
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
              style={{ color: G.muted, fontFamily: F.body, border: `1px solid ${G.border}` }}>
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        {account.isMaster && (
          <div className="flex gap-1 mb-4 overflow-x-auto border-b" style={{ borderColor: G.border }}>
            {[{ id: 'jogadores', plural: 'Jogadores', cor: G.accent }, ...TIPOS_MESTRE].map((t) => (
              <button key={t.id} onClick={() => setAba(t.id)} className="px-3 py-2 text-sm whitespace-nowrap transition-colors"
                style={{ fontFamily: F.body, color: abaAtiva === t.id ? t.cor : G.muted,
                  borderBottom: `2px solid ${abaAtiva === t.id ? t.cor : 'transparent'}`, fontWeight: abaAtiva === t.id ? 600 : 400 }}>
                {t.plural}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: F.display, color: G.text, fontSize: '1.25rem', fontWeight: 700 }}>
            {tipoAtivo ? tipoAtivo.plural : account.isMaster ? 'Todos os personagens' : 'Seus personagens'}
          </h2>
          <button onClick={() => onNew(tipoAtivo ? tipoAtivo.id : null)} className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 transition-opacity hover:opacity-90"
            style={{ background: corAba, color: '#111', fontFamily: F.body, fontWeight: 600 }}>
            <Plus size={16} /> {tipoAtivo ? `Novo ${tipoAtivo.nome.toLowerCase()}` : 'Novo personagem'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-16 justify-center" style={{ color: G.muted }}>
            <Loader2 size={18} className="animate-spin" /> Carregando fichas…
          </div>
        ) : visiveis.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: G.surface, border: `1px dashed ${G.border}` }}>
            {tipoAtivo ? <tipoAtivo.Icon size={28} style={{ color: corAba }} className="mx-auto mb-3" />
              : <Sparkles size={28} style={{ color: G.accent }} className="mx-auto mb-3" />}
            <p style={{ fontFamily: F.body, color: G.text }}>
              {tipoAtivo ? `Nenhuma ficha de ${tipoAtivo.nome.toLowerCase()} ainda.` : 'Nenhum personagem ainda.'}
            </p>
            <p className="text-sm mt-1" style={{ fontFamily: F.body, color: G.muted }}>
              {tipoAtivo ? tipoAtivo.frase : 'Toda história de Terarpeqá começa com uma marca. Crie a sua.'}
            </p>
            <button onClick={() => onNew(tipoAtivo ? tipoAtivo.id : null)} className="mt-5 rounded-lg px-4 py-2 text-sm transition-opacity hover:opacity-90"
              style={{ background: corAba, color: '#111', fontFamily: F.body, fontWeight: 600 }}>
              {tipoAtivo ? `Criar ${tipoAtivo.nome.toLowerCase()}` : 'Criar meu primeiro personagem'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visiveis.map((c) => <CharacterCard key={c.id} char={c} onOpen={onOpen} showOwner={account.isMaster} />)}
          </div>
        )}

        {/* Histórico da sessão. O servidor já entrega filtrado: a mestra recebe
            a mesa inteira, incluindo NPCs e inimigos; o jogador, só o dele. */}
        <div className="rounded-2xl p-5 mt-8" style={{ background: G.surface, border: `1px solid ${G.border}` }}>
          <HistoricoRolagens account={account} color={G.accent} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Wizard — passos
   ============================================================ */

const STEPS = ['Classe', 'Origem', 'Herança', 'Perfil', 'Atributos', 'Perícias', 'Equipamento', 'Revisão'];

/* Os passos mudam conforme o tipo de ficha. Deuses e inimigos não escolhem
   classe, então nem passam por Classe/Origem/Herança; o especial escolhe a
   classe mas a subdivisão é opcional. O wizard decide o que renderizar pelo
   NOME do passo, não pelo índice — assim as listas podem divergir sem risco. */
function stepsDaFicha(draft) {
  const tipo = tipoMestre(draft);
  if (!tipo) return STEPS;
  if (tipo.escolheClasse) return ['Classe', 'Herança', 'Perfil', 'Atributos', 'Perícias', 'Poderes', 'Revisão'];
  return ['Perfil', 'Atributos', 'Perícias', 'Poderes', 'Revisão'];
}

function Stepper({ step, origin, steps = STEPS }) {
  const color = origin ? origin.cor : V.brand;
  return (
    <div className="flex sm:flex-col gap-2 sm:gap-1 mb-6 sm:mb-0 sm:w-40 sm:pr-6 sm:border-r overflow-x-auto" style={{ borderColor: V.border }}>
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2 sm:py-2 shrink-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
            style={{ fontFamily: F.mono, background: i < step ? color : i === step ? `${color}33` : '#231a3d',
              border: `1px solid ${i <= step ? color : V.border}`, color: i < step ? '#0d0a16' : i === step ? color : '#6f6291' }}>
            {i < step ? <Check size={12} /> : i + 1}
          </div>
          <span className="text-sm whitespace-nowrap" style={{ fontFamily: F.body, color: i === step ? V.text : '#6f6291', fontWeight: i === step ? 600 : 400 }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function StepClasse({ draft, setDraft }) {
  return (
    <div>
      <Field label="Nome do personagem">
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="w-full rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500" style={inputStyle}
          placeholder="Como seu personagem é chamado?" />
      </Field>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: V.muted, fontFamily: F.body }}>
        Qual caminho você escolherá?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ORIGINS.map((o) => {
          const active = draft.originId === o.id;
          return (
            <button key={o.id} onClick={() => setDraft({ ...draft, originId: o.id, subdivisaoId: null, subdivisaoAnimalTipo: null, subdivisaoNivel: NIVEL_MIN })}
              className="text-left rounded-xl p-3.5 transition-all" style={{ background: active ? `${o.cor}1a` : '#171029', border: `1px solid ${active ? o.cor : V.border}` }}>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${o.cor}22`, border: `1px solid ${o.cor}88` }}>
                  <o.Icon size={15} color={o.cor} />
                </div>
                <div>
                  <p style={{ fontFamily: F.body, color: V.text, fontWeight: 600, fontSize: '0.9rem' }}>{o.nome}</p>
                  <p className="text-xs" style={{ color: o.cor, fontFamily: F.body }}>{o.deus} · {o.dominio}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: V.muted, fontFamily: F.body }}>{o.frase}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubdivisaoCard({ item, active, onClick, color }) {
  const nomes = nomesPericias(item.pericias || []);
  return (
    <button onClick={onClick} className="w-full text-left rounded-xl p-3.5"
      style={{ background: active ? `${color}1a` : '#171029', border: `1px solid ${active ? color : V.border}` }}>
      <p style={{ fontFamily: F.body, color: V.text, fontWeight: 700 }}>
        {item.nome}{item.foco && <span className="text-xs font-normal" style={{ color }}> · {item.foco}</span>}
      </p>
      <p className="text-xs leading-relaxed mt-1" style={{ color: V.muted, fontFamily: F.body }}>{item.desc}</p>
      {nomes.length > 0 && (
        <p className="text-xs mt-2 flex items-start gap-1.5" style={{ color, fontFamily: F.body }}>
          <Star size={11} className="shrink-0 mt-0.5" />
          <span>Treinado em {nomes.map((n, i) => (
            <React.Fragment key={n}>
              {i > 0 && ' e '}<strong>{n}</strong>
            </React.Fragment>
          ))} (+{TIERS[1].bonus} nos testes)</span>
        </p>
      )}
    </button>
  );
}

/* Tela de boas-vindas da classe: aparece logo após a escolha. */
function StepNarrativa({ draft, origin }) {
  if (!origin) return <p style={{ color: V.muted, fontFamily: F.body }}>Escolha uma classe no passo anterior primeiro.</p>;
  return (
    <div>
      <div className="rounded-xl p-5" style={{ background: `${origin.cor}14`, border: `1px solid ${origin.cor}55` }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${origin.cor}22`, border: `1px solid ${origin.cor}88` }}>
            <origin.Icon size={17} color={origin.cor} />
          </div>
          <div>
            <p style={{ fontFamily: F.display, color: V.text, fontWeight: 700 }}>{origin.nome}</p>
            <p className="text-xs" style={{ color: origin.cor, fontFamily: F.body }}>{origin.deus} · {origin.dominio}</p>
          </div>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: V.text, fontFamily: F.body }}>{origin.narrativa}</p>
      </div>

      {(PERICIAS_POR_CLASSE[origin.id] || []).length > 0 && (
        <p className="text-xs mt-4 flex items-start gap-1.5" style={{ color: origin.cor, fontFamily: F.body }}>
          <Star size={11} className="shrink-0 mt-0.5" />
          <span>Todo {origin.nome.toLowerCase()} nasce treinado em {nomesPericias(PERICIAS_POR_CLASSE[origin.id]).map((n, i) => (
            <React.Fragment key={n}>{i > 0 && ' e '}<strong>{n}</strong></React.Fragment>
          ))} (+{TIERS[1].bonus} nos testes).</span>
        </p>
      )}
    </div>
  );
}

function StepHeranca({ draft, setDraft, origin }) {
  if (!origin) return <p style={{ color: V.muted, fontFamily: F.body }}>Escolha uma classe no passo anterior primeiro.</p>;
  const mColor = markColor(origin, draft);

  return (
    <div>
      {origin.subdivisao === 'animal' && (
        <div>
          <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
            <PawPrint size={13} /> Animal-laço
          </p>
          <div className="space-y-3 mb-3">
            {TIPOS_ANIMAL.map((t) => {
              const active = draft.subdivisaoAnimalTipo === t.id;
              return (
                <button key={t.id} onClick={() => setDraft({ ...draft, subdivisaoAnimalTipo: t.id })} className="w-full text-left rounded-xl p-3.5"
                  style={{ background: active ? `${origin.cor}1a` : '#171029', border: `1px solid ${active ? origin.cor : V.border}` }}>
                  <p style={{ fontFamily: F.body, color: V.text, fontWeight: 700 }}>{t.nome}</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: V.muted, fontFamily: F.body }}>{t.desc}</p>
                </button>
              );
            })}
          </div>
          <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: '#171029', border: `1px dashed ${V.border}` }}>
            <Info size={13} className="shrink-0 mt-0.5" style={{ color: V.muted }} />
            <p className="text-xs leading-relaxed" style={{ color: V.muted, fontFamily: F.body }}>{NOTA_ANIMAL}</p>
          </div>
        </div>
      )}

      {origin.subdivisao === 'tipo' && (
        <div className="space-y-3">
          {TIPOS_AGUA.map((t) => (
            <SubdivisaoCard key={t.id} item={t} active={draft.subdivisaoId === t.id}
              onClick={() => setDraft({ ...draft, subdivisaoId: t.id })} color={origin.cor} />
          ))}
        </div>
      )}

      {origin.subdivisao === 'nivel' && (
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: V.muted, fontFamily: F.body }}>Nível mágico</p>
          <div className="flex items-center gap-3 mb-2">
            <input type="range" min={NIVEL_MIN} max={NIVEL_MAX} step={NIVEL_STEP} value={draft.subdivisaoNivel}
              onChange={(e) => setDraft({ ...draft, subdivisaoNivel: Number(e.target.value) })} className="flex-1" />
            <div className="w-9 h-9 rounded-full shrink-0" style={{ background: mColor, border: '1px solid #463a6e' }} />
            <span className="w-10 text-right text-sm" style={{ fontFamily: F.mono, color: V.text }}>{draft.subdivisaoNivel}</span>
          </div>
          <p className="text-xs" style={{ color: '#6f6291', fontFamily: F.body }}>
            Todo mago nasce com um pouco de magia (mínimo 5). A marca escurece conforme o nível sobe, até ficar negra no 100. O nível mágico também enche a mana e define quantas vagas de feitiço você tem. A mana só é gasta ao conjurar rituais, e todo feitiço é lançado com um teste de Dicionário mental — por isso o mago já nasce treinado nela.
          </p>
        </div>
      )}

      {origin.subdivisao === 'familia' && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: V.muted, fontFamily: F.body }}>Família patrona</p>
          {FAMILIAS_GUERREIRO.map((f) => (
            <SubdivisaoCard key={f.id} item={f} active={draft.subdivisaoId === f.id}
              onClick={() => setDraft({ ...draft, subdivisaoId: f.id })} color={origin.cor} />
          ))}
        </div>
      )}

      {origin.subdivisao === 'reputacao' && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: V.muted, fontFamily: F.body }}>Reputação</p>
          {REPUTACOES_PIRATA.map((r) => (
            <SubdivisaoCard key={r.id} item={r} active={draft.subdivisaoId === r.id}
              onClick={() => setDraft({ ...draft, subdivisaoId: r.id })} color={origin.cor} />
          ))}
        </div>
      )}

      {origin.subdivisao === 'corte' && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: V.muted, fontFamily: F.body }}>Tríade da corte</p>
          {CORTE_NASCIDO_OURO.map((c) => (
            <SubdivisaoCard key={c.id} item={c} active={draft.subdivisaoId === c.id}
              onClick={() => setDraft({ ...draft, subdivisaoId: c.id })} color={origin.cor} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Consulta rápida ao dicionário da classe, na hora de escrever a história. */
function DicionarioInline({ classeId, color }) {
  const [aberto, setAberto] = useState(false);
  const doc = DICIONARIOS.find((d) => d.classeId === classeId);
  if (!doc) return null;
  return (
    <div className="rounded-lg" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
      <button onClick={() => setAberto((v) => !v)} className="w-full flex items-center justify-between gap-2 p-3 text-left">
        <span className="text-sm flex items-center gap-2" style={{ fontFamily: F.body, color: V.text }}>
          <BookOpen size={14} style={{ color }} />
          {doc.titulo}
        </span>
        <ChevronDown size={14} style={{ color: V.muted, transform: aberto ? 'rotate(180deg)' : 'none' }} />
      </button>
      {!aberto && (
        <p className="text-xs px-3 pb-3" style={{ fontFamily: F.body, color: '#6f6291' }}>
          Consulte antes de escrever — ajuda a encaixar seu personagem no mundo.
        </p>
      )}
      {aberto && (
        <div className="px-3 pb-3" style={{ maxHeight: '20rem', overflowY: 'auto' }}>
          {doc.secoes.map((sec) => (
            <section key={sec.titulo} className="mb-4">
              <h4 className="text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: F.body, color }}>{sec.titulo}</h4>
              {sec.paragrafos.map((par, i) => (
                <p key={i} className="text-xs mb-2" style={{ fontFamily: F.body, color: V.muted, lineHeight: 1.7 }}>{par}</p>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* Envio de imagem reaproveitado pela foto do personagem e pela foto da marca.
   A marca é quadrada de propósito: é uma tatuagem, não um retrato. */
function EnviarImagem({ valor, onChange, color, rotulo, Icone, redondo, dica }) {
  const inputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);

  const escolher = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviando(true);
    try {
      onChange(await resizeImage(file));
    } catch (err) { /* leitura falhou; mantém o que já estava */ }
    setEnviando(false);
    e.target.value = ''; // permite reenviar o mesmo arquivo
  };

  const forma = redondo ? 'rounded-full' : 'rounded-xl';
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => inputRef.current?.click()}
        className={`w-20 h-20 ${forma} flex items-center justify-center shrink-0 overflow-hidden transition-opacity hover:opacity-90`}
        style={{ background: `${color}22`, border: `2px dashed ${color}88` }}>
        {enviando ? <Loader2 size={20} className="animate-spin" style={{ color }} />
          : valor ? <img src={valor} alt="" className="w-full h-full object-cover" />
          : <Icone size={22} color={color} />}
      </button>
      <div className="min-w-0">
        <button onClick={() => inputRef.current?.click()} className="text-sm rounded-lg px-3 py-2 transition-opacity hover:opacity-90"
          style={{ background: `${color}22`, color, border: `1px solid ${color}88`, fontFamily: F.body }}>
          {valor ? `Trocar ${rotulo}` : `Enviar ${rotulo}`}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={escolher} className="hidden" />
        {valor && (
          <button onClick={() => onChange('')} className="text-xs ml-2 hover:opacity-80" style={{ color: '#e0577a', fontFamily: F.body }}>
            Remover
          </button>
        )}
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
          {dica || 'Opcional — a imagem é redimensionada automaticamente.'}
        </p>
      </div>
    </div>
  );
}

function StepPerfil({ draft, setDraft, origin, comNome }) {
  const color = origin?.cor || V.brand;
  const livre = fichaLivre(draft);

  return (
    <div>
      {comNome && (
        <Field label="Nome">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500" style={inputStyle}
            placeholder="Como esta ficha é chamada?" />
        </Field>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <EnviarImagem valor={draft.fotoUrl} onChange={(v) => setDraft({ ...draft, fotoUrl: v })}
          color={color} rotulo="foto" Icone={Camera} redondo />
        <EnviarImagem valor={draft.marcaUrl} onChange={(v) => setDraft({ ...draft, marcaUrl: v })}
          color={color} rotulo="marca" Icone={Sparkles}
          dica="A marca que nasceu na sua pele." />
      </div>

      <Field label="História">
        <textarea value={draft.historia} onChange={(e) => setDraft({ ...draft, historia: e.target.value })}
          className="w-full rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 resize-none" style={{ ...inputStyle, minHeight: '140px' }}
          placeholder="De onde ele veio, como a marca apareceu, o que já viveu até aqui..." />
      </Field>

      {origin && !livre && <DicionarioInline classeId={origin.id} color={color} />}
    </div>
  );
}

/* Nível de classe, de 1 a 10. Vale para todas as classes e é o que abre pontos
   de atributo, degraus de perícia e ganho de vida, sanidade e mana. */
function SeletorNivel({ draft, setDraft, color }) {
  const nivel = nivelDaFicha(draft);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <Star size={13} /> Nível
        </p>
        <span className="text-xs rounded-full px-2.5 py-1" style={{ fontFamily: F.mono, background: '#171029', border: `1px solid ${V.border}`, color }}>
          {nivel} de {NIVEL_CLASSE_MAX}
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: NIVEL_CLASSE_MAX }, (_, i) => i + NIVEL_CLASSE_MIN).map((n) => {
          const ativo = n === nivel;
          return (
            <button key={n} onClick={() => setDraft({ ...draft, nivel: n })}
              className="w-9 h-9 rounded-lg text-sm transition-all"
              style={{ fontFamily: F.mono, background: ativo ? color : '#171029',
                border: `1px solid ${ativo ? color : V.border}`, color: ativo ? '#0d0a16' : V.muted, fontWeight: ativo ? 700 : 400 }}>
              {n}
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
        Cada nível soma vida e sanidade conforme a classe, e libera mais pontos de atributo e de perícia.
      </p>
    </div>
  );
}

function StepAtributos({ draft, setDraft, origin }) {
  const attrs = draft.attributes;
  const spent = ATTRS.reduce((s, a) => s + (attrs[a.key] - ATTR_BASE), 0);
  const remaining = pontosDeAtributo(draft) - spent;
  const der = computeRecursos(draft);
  const color = origin?.cor || V.brand;

  /* Ficha da mestra: sem pool e sem teto, e os máximos de vida, sanidade e
     mana são digitados aqui em vez de saírem das fórmulas. */
  if (fichaLivre(draft)) {
    const setAttr = (key, val) =>
      setDraft({ ...draft, attributes: { ...attrs, [key]: Math.max(0, Math.floor(Number(val) || 0)) } });
    const setRec = (key, val) =>
      setDraft({ ...draft, recursosLivres: { ...(draft.recursosLivres || {}), [key]: Math.max(0, Math.floor(Number(val) || 0)) } });

    return (
      <div>
        <p className="text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <Sliders size={13} /> Atributos
        </p>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
          Sem pontos para distribuir e sem valor máximo — digite o que quiser.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ATTRS.map((a) => (
            <Field key={a.key} label={a.nome} hint={a.desc}>
              <input type="number" min="0" value={attrs[a.key]} onChange={(e) => setAttr(a.key, e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" style={inputStyle} />
            </Field>
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: V.muted, fontFamily: F.body }}>Recursos</p>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
          Começam em 0 e não seguem nenhuma fórmula. A mana aparece na ficha mesmo sem classe de mago.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { campo: 'vidaMax', label: 'Vida máxima', cor: '#e0577a' },
            { campo: 'sanidadeMax', label: 'Sanidade máxima', cor: '#caa24a' },
            { campo: 'manaMax', label: 'Mana máxima', cor: '#8FB4F5' },
          ].map(({ campo, label, cor }) => (
            <Field key={campo} label={label}>
              <input type="number" min="0" value={draft.recursosLivres?.[campo] ?? 0} onChange={(e) => setRec(campo, e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                style={{ ...inputStyle, color: cor, fontFamily: F.mono }} />
            </Field>
          ))}
        </div>
      </div>
    );
  }

  const bump = (key, delta) => {
    const val = attrs[key] + delta;
    if (val < ATTR_MIN || val > ATTR_MAX) return;
    if (delta > 0 && remaining <= 0) return;
    setDraft({ ...draft, attributes: { ...attrs, [key]: val } });
  };

  const nivel = nivelDaFicha(draft);

  return (
    <div>
      <SeletorNivel draft={draft} setDraft={setDraft} color={color} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><Sliders size={13} /> Atributos</p>
        <span className="text-xs rounded-full px-2.5 py-1" style={{ fontFamily: F.mono, color: remaining === 0 ? '#9bdcb4' : V.text, background: '#171029', border: `1px solid ${V.border}` }}>
          {remaining} de {pontosDeAtributo(draft)} pontos restantes
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {ATTRS.map((a) => (
          <div key={a.key}>
            <div className="flex items-center gap-3">
              <span className="w-20 text-sm shrink-0" style={{ fontFamily: F.body, color: V.text }}>{a.nome}</span>
              <button onClick={() => bump(a.key, -1)} disabled={attrs[a.key] <= ATTR_MIN} className="w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-30" style={{ border: `1px solid ${V.border}`, color: V.muted }}>−</button>
              <div className="flex-1 h-2 rounded-full" style={{ background: '#231a3d' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${((attrs[a.key] - ATTR_MIN) / (ATTR_MAX - ATTR_MIN)) * 100}%`, background: color }} />
              </div>
              <button onClick={() => bump(a.key, 1)} disabled={attrs[a.key] >= ATTR_MAX || remaining <= 0} className="w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-30" style={{ border: `1px solid ${V.border}`, color: V.muted }}>+</button>
              <span className="w-6 text-right text-sm" style={{ fontFamily: F.mono, color: V.text }}>{attrs[a.key]}</span>
            </div>
            <p className="text-xs mt-0.5" style={{ marginLeft: '5.75rem', color: '#6f6291', fontFamily: F.body }}>{a.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
          <p className="text-xs mb-1" style={{ color: V.muted, fontFamily: F.body }}>
            Vida ({der.vidaClasse} da classe{der.subVida ? ` ${der.subVida > 0 ? '+' : '−'}${Math.abs(der.subVida)} subdivisão` : ''} +Físico×12{der.vidaNivel ? ` +${der.vidaNivel} mágico` : ''})
          </p>
          <p style={{ fontFamily: F.mono, color: '#e0577a', fontSize: '1.15rem' }}>{der.vidaMax}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
          <p className="text-xs mb-1" style={{ color: V.muted, fontFamily: F.body }}>
            Sanidade ({der.sanClasse} da classe{der.subSanidade ? ` ${der.subSanidade > 0 ? '+' : '−'}${Math.abs(der.subSanidade)} subdivisão` : ''} +Psique×12{der.sanidadeNivel ? ` +${der.sanidadeNivel} mágico` : ''})
          </p>
          <p style={{ fontFamily: F.mono, color: '#caa24a', fontSize: '1.15rem' }}>{der.sanidadeMax}</p>
        </div>
        {der.manaMax !== null && (
          <div className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
            <p className="text-xs mb-1" style={{ color: V.muted, fontFamily: F.body }}>Mana (nível mágico + 2 por nível)</p>
            <p style={{ fontFamily: F.mono, color: '#8FB4F5', fontSize: '1.15rem' }}>{der.manaMax}</p>
          </div>
        )}
      </div>
      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
        A classe e a subdivisão definem o ponto de partida, e cada nível soma o ganho da sua
        classe. A mestra ainda pode ajustar com bônus de lore depois.
        {der.manaMax !== null && ' A mana só é gasta ao conjurar rituais.'}
      </p>
    </div>
  );
}

/* Tabela de perícias no estilo CRIS: atributo, treino e bônus total.
   Perícias concedidas pela classe/subdivisão ficam travadas no mínimo Treinado. */
function TabelaPericias({ char, onChangeGrau, onChangeOutros, color, readOnly, podeRolar }) {
  const concedidas = periciasConcedidas(char);
  const [aberta, setAberta] = useState(null);
  const grade = podeRolar ? 'per-grid-rolar' : 'per-grid';

  return (
    <div>
      <div className={`${grade} px-2 pb-2 mb-1 border-b`} style={{ borderColor: V.border }}>
        <span className="uppercase tracking-widest" style={{ fontSize: '10px', color: V.muted, fontFamily: F.body }}>Perícia</span>
        <span className="per-dados uppercase tracking-widest text-center" style={{ fontSize: '10px', color: V.muted, fontFamily: F.body }}>Atrib</span>
        <span className="uppercase tracking-widest text-center" style={{ fontSize: '10px', color: V.muted, fontFamily: F.body }}>Teste</span>
        <span className="uppercase tracking-widest text-center" style={{ fontSize: '10px', color: V.muted, fontFamily: F.body }}>Treino</span>
        <span className="uppercase tracking-widest text-center" style={{ fontSize: '10px', color: V.muted, fontFamily: F.body }}>{podeRolar ? 'Rolar' : 'Outros'}</span>
      </div>

      {ATTRS.map((a) => (
        <div key={a.key} className="mb-4">
          <p className="text-xs font-semibold px-2 py-1.5" style={{ color, fontFamily: F.body }}>{a.nome}</p>
          {PERICIAS.filter((p) => p.atributo === a.key).map((p) => {
            const b = bonusDaPericia(char, p);
            const m = modificadorDoTeste(char, p);
            const travada = concedidas.has(p.id);
            const treinada = b.grau > 0;
            const cor = treinada ? color : V.muted;
            const expandida = aberta === p.id;
            return (
              <React.Fragment key={p.id}>
              <div className={`${grade} px-2 py-1.5 rounded-md`} style={{ background: treinada ? `${color}12` : 'transparent' }}>
                <button onClick={() => setAberta(expandida ? null : p.id)} className="min-w-0 text-left">
                  <p className="per-nome text-sm flex items-center gap-1.5" style={{ fontFamily: F.body, color: treinada ? V.text : V.muted, fontWeight: treinada ? 600 : 400 }}>
                    {p.nome}
                    {travada && <Star size={10} style={{ color }} className="shrink-0" />}
                    <ChevronDown size={11} className="shrink-0 transition-transform" style={{ color: V.muted, transform: expandida ? 'rotate(180deg)' : 'none' }} />
                  </p>
                </button>
                <span className="per-dados text-xs text-center" style={{ fontFamily: F.mono, color: V.muted }}>{abrevAttr(p.atributo)} {m.atributo}</span>
                <span className="text-sm text-center" style={{ fontFamily: F.mono, color: treinada ? V.text : V.muted, fontWeight: 600 }}
                  title="O que você soma ao d20: atributo + treino + outros">
                  {m.total >= 0 ? '+' : ''}{m.total}
                </span>
                {readOnly ? (
                  <span className="text-xs text-center" style={{ fontFamily: F.mono, color: cor }}>{b.treino}</span>
                ) : (
                  <select value={b.grau} onChange={(e) => onChangeGrau(p.id, Number(e.target.value))}
                    className="text-xs rounded px-1 py-1 outline-none text-center"
                    style={{ fontFamily: F.mono, background: '#171029', border: `1px solid ${V.border}`, color: cor }}>
                    {TIERS.map((t) => (
                      <option key={t.id} value={t.id} disabled={travada && t.id === 0}>{t.bonus}</option>
                    ))}
                  </select>
                )}
                {podeRolar ? (
                  <div className="flex justify-center">
                    <BotaoRolar color={color} compacto titulo={`Rolar ${p.nome}: 1d20 ${m.total >= 0 ? '+' : ''}${m.total}`}
                      onRolar={() => rolarNoServidor({
                        qtd: 1, faces: 20, modificador: m.total, categoria: 'pericia',
                        rotulo: p.nome, detalhe: detalheDoTeste(p, m), char,
                      })} />
                  </div>
                ) : readOnly ? (
                  <span className="text-xs text-center" style={{ fontFamily: F.mono, color: V.muted }}>{b.outros}</span>
                ) : (
                  <input type="number" value={b.outros}
                    onChange={(e) => onChangeOutros && onChangeOutros(p.id, Number(e.target.value) || 0)}
                    className="text-xs rounded px-1 py-1 outline-none text-center w-full"
                    style={{ fontFamily: F.mono, background: '#171029', border: `1px solid ${V.border}`, color: V.muted }} />
                )}
              </div>
              {expandida && (
                <div className="mx-2 mb-1.5 px-3 py-2 rounded-md" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
                  <p className="text-xs leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{p.desc}</p>
                  {p.detalhe && (
                    <p className="text-xs leading-relaxed mt-1.5" style={{ fontFamily: F.body, color: '#8b7fae' }}>{p.detalhe}</p>
                  )}
                  <p className="text-xs mt-1.5" style={{ fontFamily: F.body, color: '#6f6291' }}>
                    Teste: 1d20 {m.total >= 0 ? '+' : ''}{m.total} — <strong style={{ color }}>{ATTRS.find((x) => x.key === p.atributo)?.nome}</strong> {m.atributo}{m.treino ? ` + treino ${m.treino}` : ''}{m.outros ? ` + outros ${m.outros}` : ''}
                    {travada && ' · treino garantido pela sua classe ou subdivisão'}
                  </p>
                </div>
              )}
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function StepPericias({ draft, setDraft, origin }) {
  const color = origin?.cor || V.brand;
  const changeGrau = (id, grau) => setDraft({ ...draft, pericias: { ...draft.pericias, [id]: grau } });
  const changeOutros = (id, val) => setDraft({ ...draft, periciasOutros: { ...draft.periciasOutros, [id]: val } });

  /* Ficha da mestra não tem orçamento: ela distribui à vontade. */
  const livre = fichaLivre(draft);
  const total = degrausDePericia(draft);
  const gastos = degrausGastos(draft);
  const restantes = total - gastos;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-widest" style={{ color: V.muted, fontFamily: F.body }}>Perícias</p>
        {!livre && (
          <span className="text-xs rounded-full px-2.5 py-1" style={{ fontFamily: F.mono,
            color: restantes < 0 ? '#e0577a' : restantes === 0 ? '#9bdcb4' : V.text,
            background: '#171029', border: `1px solid ${restantes < 0 ? '#e0577a' : V.border}` }}>
            {restantes} de {total} degraus restantes
          </span>
        )}
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
        Destreinado 0 · Treinado +2 · Veterano +4 · Expert +6. O teste é 1d20 somando o
        atributo da perícia mais o treino e os outros bônus — é o número da coluna Teste.{' '}
        {livre
          ? 'Nesta ficha as 23 estão livres: nenhuma vem travada por classe ou subdivisão.'
          : 'Cada grau que você sobe custa um degrau do seu nível. As perícias marcadas com estrela vêm da classe ou subdivisão, já entram no Treinado e não custam nada.'}
      </p>
      {!livre && restantes < 0 && (
        <p className="text-xs mb-3 flex items-start gap-1.5" style={{ color: '#e0577a', fontFamily: F.body }}>
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          <span>Você passou do que o seu nível permite. Suba de nível ou baixe alguma perícia.</span>
        </p>
      )}
      <TabelaPericias char={draft} onChangeGrau={changeGrau} onChangeOutros={changeOutros} color={color} />
    </div>
  );
}

function ContentPicker({ title, Icon, items, selectedIds, onToggle, color, canCreate, onCreate }) {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const submit = () => {
    if (!nome.trim()) return;
    onCreate({ nome: nome.trim(), descricao: descricao.trim() });
    setNome(''); setDescricao(''); setShowForm(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><Icon size={13} /> {title}</p>
        {canCreate && (
          <button onClick={() => setShowForm((s) => !s)} className="text-xs flex items-center gap-1 rounded-full px-2 py-1" style={{ color, border: `1px solid ${color}88`, fontFamily: F.body }}>
            <Plus size={12} /> Nova
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg p-3 mb-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome"
            className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm" style={inputStyle} />
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição"
            className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm resize-none" style={{ ...inputStyle, minHeight: '60px' }} />
          <button onClick={submit} className="text-sm rounded-md px-3 py-1.5" style={{ background: color, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>Salvar</button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs italic" style={{ color: '#6f6291', fontFamily: F.body }}>Nada cadastrado ainda.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const active = selectedIds.includes(it.id);
            return (
              <button key={it.id} onClick={() => onToggle(it.id)} className="w-full text-left rounded-lg p-2.5" style={{ background: active ? `${color}18` : '#171029', border: `1px solid ${active ? color : V.border}` }}>
                <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{it.nome}</p>
                {it.descricao && <p className="text-xs" style={{ fontFamily: F.body, color: V.muted }}>{it.descricao}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Seletor de armas: catálogo filtrado por classe/subdivisão, com peso */
function SeletorArmas({ char, selecionadas, onToggle, color, customs, canCreate, onCreate, vazio }) {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dano, setDano] = useState('');
  const [teste, setTeste] = useState('');
  const [peso, setPeso] = useState('0');
  const [aberta, setAberta] = useState(null);

  const disponiveis = ARMAS_CATALOGO.filter((a) => armaDisponivel(a, char));
  const carga = pesoCarregado(char, customs);

  const submit = () => {
    if (!nome.trim()) return;
    onCreate({ nome: nome.trim(), descricao: descricao.trim(), dano: dano.trim(), teste: teste.trim(), peso: Number(peso) || 0 });
    setNome(''); setDescricao(''); setDano(''); setTeste(''); setPeso('0'); setShowForm(false);
  };

  const Card = ({ a, custom }) => {
    const ativa = selecionadas.includes(a.id);
    const expandida = aberta === a.id;
    return (
      <div className="rounded-lg" style={{ background: ativa ? `${color}18` : '#171029', border: `1px solid ${ativa ? color : V.border}` }}>
        <div className="flex items-start gap-2 p-2.5">
          <button onClick={() => onToggle(a.id)} className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: ativa ? color : 'transparent', border: `1px solid ${color}` }}>
            {ativa ? <Check size={13} color="#0d0a16" /> : <Plus size={13} color={color} />}
          </button>
          <button onClick={() => setAberta(expandida ? null : a.id)} className="min-w-0 flex-1 text-left">
            <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{a.nome}</p>
            <p className="text-xs mt-0.5" style={{ fontFamily: F.mono, color: V.muted }}>
              {a.dano || '—'} · {a.peso > 0 ? `peso ${a.peso}` : 'sem peso'}{custom ? ' · desta ficha' : ''}
            </p>
          </button>
        </div>
        {expandida && (
          <div className="px-2.5 pb-2.5">
            {a.descricao && <p className="text-xs leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{a.descricao}</p>}
            {a.teste && <p className="text-xs mt-1" style={{ fontFamily: F.body, color: '#6f6291' }}>Teste de <strong style={{ color }}>{a.teste}</strong></p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <Swords size={13} /> Armas
        </p>
        <span className="text-xs rounded-full px-2.5 py-1" style={{
          fontFamily: F.mono, background: '#171029',
          border: `1px solid ${carga.excedido ? '#e0577a' : V.border}`,
          color: carga.excedido ? '#e0577a' : V.muted,
        }}>
          carga {carga.total}/{carga.capacidade}
        </span>
      </div>

      {disponiveis.length === 0 && customs.length === 0 ? (
        <p className="text-xs italic mb-2" style={{ color: '#6f6291', fontFamily: F.body }}>
          {vazio || 'Nenhuma arma disponível ainda — escolha sua subdivisão primeiro.'}
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {disponiveis.map((a) => <Card key={a.id} a={a} />)}
          {customs.map((a) => <Card key={a.id} a={a} custom />)}
        </div>
      )}

      {carga.excedido && (
        <p className="text-xs mb-2 flex items-start gap-1.5" style={{ color: '#e0577a', fontFamily: F.body }}>
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          <span>Você está carregando mais peso do que aguenta. A mestra decide a penalidade.</span>
        </p>
      )}

      {canCreate && (
        <>
          <button onClick={() => setShowForm((v) => !v)} className="text-xs flex items-center gap-1 rounded-full px-2.5 py-1.5" style={{ color, border: `1px solid ${color}88`, fontFamily: F.body }}>
            <Plus size={12} /> Criar arma própria
          </button>
          {showForm && (
            <div className="rounded-lg p-3 mt-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da arma"
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm" style={inputStyle} />
              <div className="flex gap-2 mb-2">
                <input value={dano} onChange={(e) => setDano(e.target.value)} placeholder="Dano (ex: 1d10)"
                  className="flex-1 rounded-md px-2.5 py-2 outline-none text-sm" style={inputStyle} />
                <input value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Peso" type="number"
                  className="w-20 rounded-md px-2 py-2 outline-none text-sm text-center" style={inputStyle} />
              </div>
              <input value={teste} onChange={(e) => setTeste(e.target.value)} placeholder="Teste (ex: Instrumento físico)"
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm" style={inputStyle} />
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Como a arma é"
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm resize-none" style={{ ...inputStyle, minHeight: '60px' }} />
              <button onClick={submit} className="text-sm rounded-md px-3 py-1.5" style={{ background: color, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>Salvar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Catálogo de itens + inventário livre. Itens do catálogo carregam peso e descrição. */
function SeletorItens({ char, inventario, onAdd, onRemove, color }) {
  const [aberto, setAberto] = useState(null);
  const [novoItem, setNovoItem] = useState('');
  const [novaQtd, setNovaQtd] = useState('1');
  const [novaDesc, setNovaDesc] = useState('');
  const [novoPeso, setNovoPeso] = useState('0');
  /* Ficha da mestra não tem catálogo, então nem abre a seção. */
  const semCatalogo = fichaLivre(char);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(!semCatalogo);

  const disponiveis = ITENS_CATALOGO.filter((i) => itemDisponivel(i, char));
  const bloqueados = ITENS_CATALOGO.filter((i) => i.classe === char.originId && itemBloqueadoPorNivel(i, char));

  const addDoCatalogo = (item) => {
    onAdd({ id: uid(), catalogoId: item.id, nome: item.nome, descricao: item.descricao, peso: item.peso, quantidade: '1' });
  };
  const addLivre = () => {
    if (!novoItem.trim()) return;
    onAdd({ id: uid(), nome: novoItem.trim(), descricao: novaDesc.trim(), peso: Number(novoPeso) || 0, quantidade: novaQtd || '1' });
    setNovoItem(''); setNovaQtd('1'); setNovaDesc(''); setNovoPeso('0');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <Backpack size={13} /> Itens
        </p>
        {!semCatalogo && (
          <button onClick={() => setMostrarCatalogo((v) => !v)} className="text-xs rounded-full px-2.5 py-1"
            style={{ color, border: `1px solid ${color}88`, fontFamily: F.body }}>
            {mostrarCatalogo ? 'Ocultar catálogo' : 'Ver catálogo'}
          </button>
        )}
      </div>

      {mostrarCatalogo && (
        <div className="space-y-2 mb-4">
          {disponiveis.length === 0 && bloqueados.length === 0 ? (
            <p className="text-xs italic" style={{ color: '#6f6291', fontFamily: F.body }}>
              Nenhum item de catálogo disponível ainda — escolha sua subdivisão primeiro.
            </p>
          ) : (
            <>
              {disponiveis.map((item) => {
                const expandido = aberto === item.id;
                return (
                  <div key={item.id} className="rounded-lg" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
                    <div className="flex items-start gap-2 p-2.5">
                      <button onClick={() => addDoCatalogo(item)} className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ border: `1px solid ${color}` }}>
                        <Plus size={13} color={color} />
                      </button>
                      <button onClick={() => setAberto(expandido ? null : item.id)} className="min-w-0 flex-1 text-left">
                        <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{item.nome}</p>
                        <p className="text-xs mt-0.5" style={{ fontFamily: F.mono, color: V.muted }}>
                          {item.peso > 0 ? `peso ${item.peso}` : 'sem peso'} · toque para ler
                        </p>
                      </button>
                    </div>
                    {expandido && <p className="text-xs leading-relaxed px-2.5 pb-2.5" style={{ fontFamily: F.body, color: V.muted }}>{item.descricao}</p>}
                  </div>
                );
              })}
              {bloqueados.map((item) => (
                <div key={item.id} className="rounded-lg p-2.5 flex items-start gap-2" style={{ background: '#171029', border: `1px solid ${V.border}`, opacity: 0.55 }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ border: `1px solid ${V.border}` }}>
                    <Lock size={11} color={V.muted} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{item.nome}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: F.body, color: '#c9899f' }}>Você precisa ser um mago negro para carregar este item.</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: V.muted, fontFamily: F.body }}>No inventário</p>
      {inventario.length === 0 ? (
        <p className="text-xs italic mb-3" style={{ color: '#6f6291', fontFamily: F.body }}>Inventário vazio.</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {inventario.map((it) => (
            <div key={it.id} className="flex items-start justify-between gap-2 rounded-lg px-3 py-2" style={{ background: `${color}12`, border: `1px solid ${color}55` }}>
              <div className="min-w-0">
                <p className="text-sm" style={{ fontFamily: F.body, color: V.text }}>
                  {it.nome} <span style={{ color: V.muted }}>×{it.quantidade}</span>
                  {it.peso > 0 && <span style={{ fontFamily: F.mono, color: V.muted }}> · peso {it.peso}</span>}
                </p>
                {it.descricao && <p className="text-xs mt-0.5 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{it.descricao}</p>}
              </div>
              <button onClick={() => onRemove(it.id)} className="shrink-0 mt-0.5"><X size={14} color="#6f6291" /></button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: V.muted, fontFamily: F.body }}>Adicionar item próprio</p>
      <div className="flex gap-2 mb-2">
        <input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Item"
          className="flex-1 rounded-lg px-3 py-2 outline-none text-sm" style={inputStyle} />
        <input value={novaQtd} onChange={(e) => setNovaQtd(e.target.value)} placeholder="Qtd"
          className="w-14 rounded-lg px-2 py-2 outline-none text-sm text-center" style={inputStyle} />
        <input value={novoPeso} onChange={(e) => setNovoPeso(e.target.value)} placeholder="Peso" type="number"
          className="w-16 rounded-lg px-2 py-2 outline-none text-sm text-center" style={inputStyle} />
      </div>
      <div className="flex gap-2">
        <textarea value={novaDesc} onChange={(e) => setNovaDesc(e.target.value)} placeholder="Descrição (opcional)"
          className="flex-1 rounded-lg px-3 py-2 outline-none text-sm resize-none" style={{ ...inputStyle, minHeight: '56px' }} />
        <button onClick={addLivre} className="rounded-lg px-3 self-stretch" style={{ background: color, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/* Seletor de armadura: só uma equipada por vez */
function SeletorArmadura({ char, equipada, onSelect, color, customs, canCreate, onCreate, vazio }) {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [defesa, setDefesa] = useState('2');
  const [peso, setPeso] = useState('1');

  const disponiveis = ARMADURAS_CATALOGO.filter((a) => armaduraDisponivel(a, char));

  const submit = () => {
    if (!nome.trim()) return;
    onCreate({ nome: nome.trim(), descricao: descricao.trim(), defesa: Number(defesa) || 0, peso: Number(peso) || 0 });
    setNome(''); setDescricao(''); setDefesa('2'); setPeso('1'); setShowForm(false);
  };

  const Card = ({ a, custom }) => {
    const ativa = equipada === a.id;
    return (
      <button onClick={() => onSelect(ativa ? null : a.id)} className="w-full text-left rounded-lg p-2.5"
        style={{ background: ativa ? `${color}18` : '#171029', border: `1px solid ${ativa ? color : V.border}` }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{a.nome}</p>
          <span className="text-xs shrink-0" style={{ fontFamily: F.mono, color }}>+{a.defesa}</span>
        </div>
        {a.descricao && <p className="text-xs mt-0.5 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{a.descricao}</p>}
        <p className="text-xs mt-1" style={{ fontFamily: F.mono, color: '#6f6291' }}>
          {a.peso > 0 ? `peso ${a.peso}` : 'sem peso'}{custom ? ' · desta ficha' : ''}{ativa ? ' · equipada' : ''}
        </p>
      </button>
    );
  };

  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
        <Shield size={13} /> Armadura
      </p>
      <p className="text-xs mb-2" style={{ color: '#6f6291', fontFamily: F.body }}>
        Só uma por vez. O bônus soma na Defesa, no Bloqueio e na Esquiva.
      </p>

      {disponiveis.length === 0 && customs.length === 0 ? (
        <p className="text-xs italic mb-2" style={{ color: '#6f6291', fontFamily: F.body }}>
          {vazio || 'Nenhuma armadura disponível ainda — escolha sua subdivisão primeiro.'}
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {disponiveis.map((a) => <Card key={a.id} a={a} />)}
          {customs.map((a) => <Card key={a.id} a={a} custom />)}
        </div>
      )}

      {canCreate && (
        <>
          <button onClick={() => setShowForm((v) => !v)} className="text-xs flex items-center gap-1 rounded-full px-2.5 py-1.5" style={{ color, border: `1px solid ${color}88`, fontFamily: F.body }}>
            <Plus size={12} /> Criar armadura própria
          </button>
          {showForm && (
            <div className="rounded-lg p-3 mt-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da armadura"
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm" style={inputStyle} />
              <div className="flex gap-2 mb-2">
                <input value={defesa} onChange={(e) => setDefesa(e.target.value)} placeholder="Defesa" type="number"
                  className="flex-1 rounded-md px-2.5 py-2 outline-none text-sm text-center" style={inputStyle} />
                <input value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Peso" type="number"
                  className="flex-1 rounded-md px-2.5 py-2 outline-none text-sm text-center" style={inputStyle} />
              </div>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Como a armadura é"
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm resize-none" style={{ ...inputStyle, minHeight: '60px' }} />
              <button onClick={submit} className="text-sm rounded-md px-3 py-1.5" style={{ background: color, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>Salvar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Seletor de habilidades: mostra só as que a classe/subdivisão do personagem libera */
function SeletorHabilidades({ char, selecionadas, onToggle, color, customs, canCreate, onCreate,
  titulo = 'Habilidades', rotuloCriar = 'Criar habilidade própria', vazio }) {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [aberta, setAberta] = useState(null);

  const disponiveis = HABILIDADES_CATALOGO.filter((h) => habilidadeDisponivel(h, char));

  const submit = () => {
    if (!nome.trim()) return;
    onCreate({ nome: nome.trim(), descricao: descricao.trim() });
    setNome(''); setDescricao(''); setShowForm(false);
  };

  const Card = ({ h, custom }) => {
    const ativa = selecionadas.includes(h.id);
    const expandida = aberta === h.id;
    return (
      <div className="rounded-lg" style={{ background: ativa ? `${color}18` : '#171029', border: `1px solid ${ativa ? color : V.border}` }}>
        <div className="flex items-start gap-2 p-2.5">
          <button onClick={() => onToggle(h.id)} className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: ativa ? color : 'transparent', border: `1px solid ${color}` }}>
            {ativa ? <Check size={13} color="#0d0a16" /> : <Plus size={13} color={color} />}
          </button>
          <button onClick={() => setAberta(expandida ? null : h.id)} className="min-w-0 flex-1 text-left">
            <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{h.nome}</p>
            <p className="text-xs mt-0.5" style={{ fontFamily: F.body, color: V.muted }}>
              {custom ? 'criada nesta ficha' : escopoHabilidade(h)} · toque para ler
            </p>
          </button>
        </div>
        {expandida && (
          <div className="px-2.5 pb-2.5">
            <p className="text-xs leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{h.descricao}</p>
            {h.resistencia && <LinhaResistencia texto={h.resistencia} color={color} />}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
        <Flame size={13} /> {titulo}
      </p>

      {disponiveis.length === 0 && customs.length === 0 ? (
        <p className="text-xs italic mb-2" style={{ color: '#6f6291', fontFamily: F.body }}>
          {vazio || 'Nenhuma habilidade disponível ainda — escolha sua subdivisão primeiro.'}
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {disponiveis.map((h) => <Card key={h.id} h={h} />)}
          {customs.map((h) => <Card key={h.id} h={h} custom />)}
        </div>
      )}

      {canCreate && (
        <>
          <button onClick={() => setShowForm((v) => !v)} className="text-xs flex items-center gap-1 rounded-full px-2.5 py-1.5" style={{ color, border: `1px solid ${color}88`, fontFamily: F.body }}>
            <Plus size={12} /> {rotuloCriar}
          </button>
          {showForm && (
            <div className="rounded-lg p-3 mt-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da habilidade"
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm" style={inputStyle} />
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição, custo, efeitos..."
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm resize-none" style={{ ...inputStyle, minHeight: '70px' }} />
              <button onClick={submit} className="text-sm rounded-md px-3 py-1.5" style={{ background: color, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>Salvar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Seletor de feitiços: catálogo com bloqueio por nível + feitiços criados pela mestra */
function SeletorFeiticos({ nivelMagico, selecionados, onToggle, onEvolucao, vagas, color, customs, canCreate, onCreate, semCatalogo }) {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [aberto, setAberto] = useState(null);

  const submit = () => {
    if (!nome.trim()) return;
    onCreate({ nome: nome.trim(), descricao: descricao.trim() });
    setNome(''); setDescricao(''); setShowForm(false);
  };

  const Card = ({ f, bloqueado, custom }) => {
    const escolhido = (selecionados || []).find((x) => feiticoId(x) === f.id);
    const ativo = !!escolhido;
    const evolucao = ativo ? feiticoEvolucao(escolhido) : 1;
    const expandido = aberto === f.id;
    return (
      <div className="rounded-lg" style={{
        background: ativo ? `${color}18` : '#171029',
        border: `1px solid ${ativo ? color : V.border}`,
        opacity: bloqueado ? 0.55 : 1,
      }}>
        <div className="flex items-start gap-2 p-2.5">
          <button onClick={() => !bloqueado && onToggle(f.id)} disabled={bloqueado}
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: ativo ? color : 'transparent', border: `1px solid ${bloqueado ? V.border : color}`, cursor: bloqueado ? 'not-allowed' : 'pointer' }}>
            {bloqueado ? <Lock size={11} color={V.muted} /> : ativo ? <Check size={13} color="#0d0a16" /> : <Plus size={13} color={color} />}
          </button>
          <button onClick={() => !bloqueado && setAberto(expandido ? null : f.id)} disabled={bloqueado} className="min-w-0 flex-1 text-left">
            <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{f.nome}</p>
            {bloqueado ? (
              <p className="text-xs mt-0.5" style={{ fontFamily: F.body, color: '#c9899f' }}>{motivoBloqueio(f)}</p>
            ) : (
              <p className="text-xs mt-0.5" style={{ fontFamily: F.body, color: V.muted }}>
                {custom ? 'criado pela mestra' : f.nivelMin === 'negro' ? 'exclusivo de magos negros' : `nível ${f.nivelMin}+`}
                {' · toque para ler'}
              </p>
            )}
          </button>
        </div>

        {/* A evolução escolhida define quanto o feitiço custa em vagas: a I
            ocupa uma, a II duas e a III três. Feitiço sem evoluções não mostra
            o seletor e vale sempre uma vaga. */}
        {ativo && !bloqueado && onEvolucao && temEvolucoes(f) && (
          <div className="flex items-center gap-1.5 px-2.5 pb-2.5 flex-wrap">
            <span className="text-xs mr-1" style={{ fontFamily: F.body, color: V.muted }}>Evolução</span>
            {[1, 2, 3].map((n) => {
              const sel = evolucao === n;
              return (
                <button key={n} onClick={() => onEvolucao(f.id, n)}
                  className="px-2 py-0.5 rounded-md text-xs transition-all"
                  style={{ fontFamily: F.mono, background: sel ? color : 'transparent',
                    border: `1px solid ${sel ? color : V.border}`, color: sel ? '#0d0a16' : V.muted, fontWeight: sel ? 700 : 400 }}
                  title={`Ocupa ${n} ${n === 1 ? 'vaga' : 'vagas'}`}>
                  {'I'.repeat(n)}
                </button>
              );
            })}
            <span className="text-xs" style={{ fontFamily: F.mono, color: '#6f6291' }}>
              · {evolucao} {evolucao === 1 ? 'vaga' : 'vagas'}
            </span>
          </div>
        )}
        {expandido && !bloqueado && (
          <div className="px-2.5 pb-2.5">
            {temEvolucoes(f) ? (
              f.evolucoes.map((texto, i) => (
                <div key={i} className={i > 0 ? 'mt-2' : ''}>
                  <p className="text-xs" style={{ fontFamily: F.mono, color: evolucao === i + 1 ? color : '#6f6291' }}>
                    Evolução {'I'.repeat(i + 1)}{evolucao === i + 1 ? ' · escolhida' : ''}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{texto}</p>
                </div>
              ))
            ) : (
              <>
                <p className="text-xs leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{f.descricao}</p>
                <p className="text-xs leading-relaxed mt-1.5" style={{ fontFamily: F.body, color: '#6f6291' }}>{AVISO_SEM_EVOLUCAO}</p>
              </>
            )}
            {f.nota && (
              <p className="text-xs leading-relaxed mt-2" style={{ fontFamily: F.body, color: V.muted }}>{f.nota}</p>
            )}
            {f.resistencia && <LinhaResistencia texto={f.resistencia} color={color} />}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <Wand2 size={13} /> Feitiços
        </p>
        {!semCatalogo && (
          <span className="text-xs rounded-full px-2.5 py-1" style={{ fontFamily: F.mono, background: '#171029', border: `1px solid ${V.border}`, color }}>
            nível {nivelMagico}
          </span>
        )}
      </div>

      {/* Quantas vagas o nível mágico concede e quantas já foram usadas. */}
      {typeof vagas === 'number' && (() => {
        const usadas = vagasGastas(selecionados);
        const estourou = usadas > vagas;
        return (
          <div className="rounded-lg p-2.5 mb-3" style={{ background: '#171029', border: `1px solid ${estourou ? '#e0577a' : V.border}` }}>
            <p className="text-xs" style={{ fontFamily: F.mono, color: estourou ? '#e0577a' : V.text }}>
              {usadas} de {vagas} vagas usadas
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ fontFamily: F.body, color: '#6f6291' }}>
              São 2 vagas de início e mais 1 a cada 10 níveis mágicos. Um feitiço na evolução II
              ocupa 2 vagas e na evolução III ocupa 3. Todo feitiço é lançado com um teste de
              Dicionário mental.
            </p>
          </div>
        );
      })()}

      {/* Ficha da mestra não puxa o catálogo nem o bloqueio por nível mágico. */}
      {semCatalogo && customs.length === 0 ? (
        <p className="text-xs italic mb-2" style={{ color: '#6f6291', fontFamily: F.body }}>
          Nada criado ainda — use o botão abaixo.
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {!semCatalogo && FEITICOS_CATALOGO.map((f) => (
            <Card key={f.id} f={f} bloqueado={!feiticoLiberado(f, nivelMagico)} />
          ))}
          {customs.map((f) => <Card key={f.id} f={f} bloqueado={false} custom />)}
        </div>
      )}

      {canCreate && (
        <>
          <button onClick={() => setShowForm((v) => !v)} className="text-xs flex items-center gap-1 rounded-full px-2.5 py-1.5" style={{ color, border: `1px solid ${color}88`, fontFamily: F.body }}>
            <Plus size={12} /> Criar feitiço próprio
          </button>
          {showForm && (
            <div className="rounded-lg p-3 mt-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do feitiço"
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm" style={inputStyle} />
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição, custo de mana, efeitos..."
                className="w-full rounded-md px-2.5 py-2 mb-2 outline-none text-sm resize-none" style={{ ...inputStyle, minHeight: '70px' }} />
              <button onClick={submit} className="text-sm rounded-md px-3 py-1.5" style={{ background: color, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>Salvar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StepEquipamento({ draft, setDraft, origin, account, content, onCreateContent }) {
  const color = origin?.cor || V.brand;
  const tipo = tipoMestre(draft);
  const unificado = !!tipo?.poderesUnificados; // deus: habilidades e feitiços viram um só
  const { loading: loadingContent } = content;
  const createContent = (type, data) => onCreateContent(type, data);

  const toggleArma = (id) => setDraft({ ...draft, armas: draft.armas.includes(id) ? draft.armas.filter((x) => x !== id) : [...draft.armas, id] });
  /* Cada feitiço guarda a evolução escolhida. As fichas antigas gravaram só o
     id em texto; feiticoEvolucao trata esse caso como evolução 1. */
  const toggleFeitico = (id) => {
    const atuais = draft.feiticos || [];
    const jaTem = atuais.some((f) => feiticoId(f) === id);
    setDraft({ ...draft, feiticos: jaTem ? atuais.filter((f) => feiticoId(f) !== id) : [...atuais, { id, evolucao: 1 }] });
  };
  const mudarEvolucao = (id, evo) =>
    setDraft({ ...draft, feiticos: (draft.feiticos || []).map((f) => (feiticoId(f) === id ? { id, evolucao: evo } : f)) });


  if (loadingContent) return <div className="flex items-center gap-2 py-10 justify-center" style={{ color: V.muted }}><Loader2 size={16} className="animate-spin" /> Carregando conteúdo do jogo…</div>;

  return (
    <div>
      <SeletorArmas char={draft} selecionadas={draft.armas} onToggle={toggleArma} color={color}
        customs={customsDe(content, 'armas', draft.armas, account?.isMaster, draft)} vazio={tipo ? 'Nada criado ainda — use o botão abaixo.' : undefined}
        canCreate onCreate={(d) => createContent('arma', d)} />
      <SeletorArmadura char={draft} equipada={draft.armaduraId}
        onSelect={(id) => setDraft({ ...draft, armaduraId: id })} color={color}
        customs={customsDe(content, 'armaduras', draft.armaduraId ? [draft.armaduraId] : [], account?.isMaster, draft)} vazio={tipo ? 'Nada criado ainda — use o botão abaixo.' : undefined}
        canCreate onCreate={(d) => createContent('armadura', d)} />

      <SeletorHabilidades char={draft} selecionadas={draft.habilidades || []}
        onToggle={(id) => setDraft({ ...draft, habilidades: (draft.habilidades || []).includes(id) ? draft.habilidades.filter((x) => x !== id) : [...(draft.habilidades || []), id] })}
        color={color} customs={customsDe(content, 'habilidades', draft.habilidades, account?.isMaster, draft)}
        titulo={unificado ? 'Poderes Divinos' : 'Habilidades'}
        rotuloCriar={unificado ? 'Criar poder divino' : 'Criar habilidade própria'}
        vazio={tipo ? 'Nada criado ainda — use o botão abaixo.' : undefined}
        canCreate onCreate={(d) => createContent('habilidade', d)} />

      {origin?.id === 'mago' && (
        <SeletorFeiticos nivelMagico={draft.subdivisaoNivel || NIVEL_MIN} selecionados={draft.feiticos}
          onToggle={toggleFeitico} onEvolucao={mudarEvolucao} vagas={tipo ? undefined : vagasDeFeitico(draft)}
          color={color} customs={customsDe(content, 'feiticos', idsDeFeiticos(draft.feiticos), account?.isMaster)} semCatalogo={!!tipo}
          canCreate={account?.isMaster} onCreate={(d) => createContent('feitico', d)} />
      )}

      <SeletorItens char={draft} inventario={draft.inventario || []}
        onAdd={(item) => setDraft({ ...draft, inventario: [...(draft.inventario || []), item] })}
        onRemove={(id) => setDraft({ ...draft, inventario: draft.inventario.filter((i) => i.id !== id) })}
        color={color} />
    </div>
  );
}

/* ============================================================
   Ficha (revisão e visualização final)
   ============================================================ */

function CharacterSheetBody({ char, contentIndex, onChangeAtual }) {
  const origin = originDaFicha(char);
  const der = computeRecursos(char);
  const mColor = markColor(origin, char);
  const [marcaAberta, setMarcaAberta] = useState(false);

  const subdivLabel = () => {
    if (origin.subdivisao === 'animal') return TIPOS_ANIMAL.find((t) => t.id === char.subdivisaoAnimalTipo)?.nome || null;
    if (origin.subdivisao === 'tipo') return TIPOS_AGUA.find((t) => t.id === char.subdivisaoId)?.nome || null;
    if (origin.subdivisao === 'nivel') return `Nível mágico ${char.subdivisaoNivel}`;
    if (origin.subdivisao === 'familia') return FAMILIAS_GUERREIRO.find((f) => f.id === char.subdivisaoId)?.nome || null;
    if (origin.subdivisao === 'reputacao') return REPUTACOES_PIRATA.find((r) => r.id === char.subdivisaoId)?.nome || null;
    if (origin.subdivisao === 'corte') return CORTE_NASCIDO_OURO.find((c) => c.id === char.subdivisaoId)?.nome || null;
    return null;
  };

  const namesFrom = (ids, list) => ids.map((id) => list.find((x) => x.id === id)?.nome).filter(Boolean);

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `${origin.cor}22`, border: `2px solid ${mColor}` }}>
          {char.fotoUrl ? <img src={char.fotoUrl} alt="" className="w-full h-full object-cover" /> : (origin.Icon ? <origin.Icon size={26} color={origin.cor} /> : null)}
        </div>
        {/* A marca fica ao lado do retrato, quadrada, para não ser confundida com ele. */}
        {char.marcaUrl && (
          <button onClick={() => setMarcaAberta(true)} title="Ver a marca de perto"
            className="w-16 h-16 rounded-xl shrink-0 overflow-hidden transition-opacity hover:opacity-80"
            style={{ border: `2px solid ${mColor}` }}>
            <img src={char.marcaUrl} alt="Marca do personagem" className="w-full h-full object-cover" />
          </button>
        )}
        <div>
          <h3 style={{ fontFamily: F.display, color: V.text, fontWeight: 700, fontSize: '1.4rem' }}>{char.name || 'Personagem sem nome'}</h3>
          <p className="text-sm" style={{ color: origin.cor, fontFamily: F.body }}>
            {(() => {
              const tipo = tipoMestre(char);
              if (!tipo) return `${origin.nome} · filho(a) de ${origin.deus}`;
              /* Deus e inimigo não têm classe; o especial mostra a que escolheu. */
              return tipo.escolheClasse && char.originId ? `${tipo.nome} · ${origin.nome}` : tipo.nome;
            })()}
          </p>
          <p className="text-xs mt-0.5" style={{ color: V.muted, fontFamily: F.body }}>
            {!fichaLivre(char) && <span style={{ fontFamily: F.mono }}>nível {nivelDaFicha(char)}</span>}
            {!fichaLivre(char) && subdivLabel() ? ' · ' : ''}
            {subdivLabel()}
          </p>
        </div>
      </div>

      {/* Marca em tamanho grande, para quem quiser ver o desenho. */}
      {marcaAberta && char.marcaUrl && (
        <button onClick={() => setMarcaAberta(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(8,6,16,0.88)' }}>
          <div className="max-w-md w-full">
            <img src={char.marcaUrl} alt="Marca do personagem" className="w-full rounded-2xl"
              style={{ border: `2px solid ${mColor}` }} />
            <p className="text-xs text-center mt-3" style={{ color: V.muted, fontFamily: F.body }}>
              A marca de {char.name || 'este personagem'} · toque para fechar
            </p>
          </div>
        </button>
      )}

      {char.editedByMaster && (
        <div className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 mb-4 w-fit" style={{ background: '#332a52', color: '#d9c3f7', fontFamily: F.body }}>
          <Info size={12} /> Editado pela mestra
        </div>
      )}

      <div className={`grid grid-cols-1 ${der.manaMax !== null ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 mb-6 mt-4`}>
        {onChangeAtual ? (
          <>
            <BarraAjustavel label="Vida" atual={valorAtual(char, 'vida', der.vidaMax)} max={der.vidaMax}
              color="#e0577a" onChange={(v) => onChangeAtual('vida', v)} />
            <BarraAjustavel label="Sanidade" atual={valorAtual(char, 'sanidade', der.sanidadeMax)} max={der.sanidadeMax}
              color="#caa24a" onChange={(v) => onChangeAtual('sanidade', v)} />
            {der.manaMax !== null && (
              <BarraAjustavel label="Mana" atual={valorAtual(char, 'mana', der.manaMax)} max={der.manaMax}
                color="#8FB4F5" onChange={(v) => onChangeAtual('mana', v)} />
            )}
          </>
        ) : (
          <>
            <ProgressBar value={valorAtual(char, 'vida', der.vidaMax)} max={der.vidaMax} color="#e0577a" label="Vida" />
            <ProgressBar value={valorAtual(char, 'sanidade', der.sanidadeMax)} max={der.sanidadeMax} color="#caa24a" label="Sanidade" />
            {der.manaMax !== null && <ProgressBar value={valorAtual(char, 'mana', der.manaMax)} max={der.manaMax} color="#8FB4F5" label="Mana" />}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {ATTRS.map((a) => (
          <div key={a.key} className="rounded-lg p-2.5 text-center" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
            <p className="text-xs mb-1" style={{ color: V.muted, fontFamily: F.body }}>{a.nome}</p>
            <p style={{ fontFamily: F.mono, color: V.text, fontSize: '1.05rem' }}>{char.attributes[a.key]}</p>
          </div>
        ))}
      </div>

      {char.historia && (
        <div className="mb-4 rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
          <p className="text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><ScrollText size={12} /> História</p>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: V.text, fontFamily: F.body }}>{char.historia}</p>
        </div>
      )}

      {(() => {
        const treinadas = PERICIAS.filter((p) => grauDaPericia(char, p.id) > 0);
        if (treinadas.length === 0) return null;
        return (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><Star size={12} /> Perícias treinadas</p>
            <div className="flex flex-wrap gap-2">
              {treinadas.map((p) => {
                const b = bonusDaPericia(char, p);
                return (
                  <span key={p.id} className="text-xs rounded-full px-2.5 py-1" style={{ fontFamily: F.body, background: '#171029', border: `1px solid ${V.border}`, color: V.text }}>
                    {p.nome} <span style={{ fontFamily: F.mono, color: origin.cor }}>+{b.total}</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {(char.armas?.length > 0 || char.habilidades?.length > 0 || char.feiticos?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {char.armas?.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <p className="text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><Swords size={12} /> Armas</p>
              {namesFrom(char.armas, catalogoDe(contentIndex, 'armas', ARMAS_CATALOGO, char)).map((n) => <p key={n} className="text-sm" style={{ color: V.text, fontFamily: F.body }}>{n}</p>)}
            </div>
          )}
          {char.habilidades?.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <p className="text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><Flame size={12} /> Habilidades</p>
              {namesFrom(char.habilidades, catalogoDe(contentIndex, 'habilidades', HABILIDADES_CATALOGO, char)).map((n) => <p key={n} className="text-sm" style={{ color: V.text, fontFamily: F.body }}>{n}</p>)}
            </div>
          )}
          {char.feiticos?.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <p className="text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><Wand2 size={12} /> Feitiços</p>
              {namesFrom(idsDeFeiticos(char.feiticos), catalogoDe(contentIndex, 'feiticos', FEITICOS_CATALOGO)).map((n) => <p key={n} className="text-sm" style={{ color: V.text, fontFamily: F.body }}>{n}</p>)}
            </div>
          )}
        </div>
      )}

      {char.inventario?.length > 0 && (
        <div className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
          <p className="text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}><Backpack size={12} /> Inventário</p>
          {char.inventario.map((it) => (
            <div key={it.id} className="mb-1.5">
              <p className="text-sm" style={{ color: V.text, fontFamily: F.body }}>{it.nome} <span style={{ color: V.muted }}>×{it.quantidade}</span></p>
              {it.descricao && <p className="text-xs leading-relaxed" style={{ color: V.muted, fontFamily: F.body }}>{it.descricao}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Wizard container
   ============================================================ */

function blankDraft(owner, tipoFicha = null) {
  /* Na ficha da mestra tudo começa em 0 — atributos inclusive — para ela
     montar do zero, sem herdar nenhum valor inicial das regras de jogador. */
  const livre = !!tipoFicha;
  const base = livre ? 0 : ATTR_BASE;
  return {
    id: null, owner, name: '', originId: null, tipoFicha,
    nivel: NIVEL_CLASSE_MIN,
    subdivisaoId: null, subdivisaoAnimalTipo: null, subdivisaoNivel: NIVEL_MIN,
    fotoUrl: '', marcaUrl: '', historia: '', animal: null,
    attributes: { intelecto: base, psique: base, fisico: base, motoras: base },
    recursosLivres: { vidaMax: 0, sanidadeMax: 0, manaMax: 0 },
    custom: { armas: [], armaduras: [], habilidades: [] },
    pericias: {}, periciasOutros: {}, recursos: { vidaBonusLore: 0, sanidadeBonusLore: 0 },
    atual: { vida: null, sanidade: null, mana: null },
    defesas: { equipamento: 0, defesaOutros: 0, bloqueioOutros: 0, esquivaOutros: 0 },
    armas: [], armaduraId: null, feiticos: [], habilidades: [], inventario: [],
    editedByMaster: false, editedAt: null, createdAt: null,
  };
}

function CreateWizard({ account, onSave, onCancel, tipoFicha = null }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(blankDraft(account.username, tipoFicha));
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({ ...conteudoVazio(), loading: true });
  const escopo = tipoFicha || 'jogador';
  const origin = ORIGINS.find((o) => o.id === draft.originId) || tipoMestre(draft);

  const loadContent = useCallback(async () => {
    setContent((c) => ({ ...c, loading: true }));
    const index = await carregarConteudo(escopo);
    setContent({ ...index, loading: false });
  }, [escopo]);

  useEffect(() => { loadContent(); }, [loadContent]);

  const createContent = async (type, data) => {
    const { id, item } = montarConteudo(data, escopo);
    if (type === 'feitico') {
      /* Feitiço continua saindo do catálogo da mestra, compartilhado no escopo. */
      await sSet(`content:${escopo}:${type}:${id}`, JSON.stringify(item));
      await loadContent();
      setDraft((d) => ({ ...d, feiticos: [...(d.feiticos || []), { id, evolucao: 1 }] }));
      return;
    }
    /* Arma, armadura e habilidade ficam presas a esta ficha e a mais nenhuma. */
    const campo = CAMPO_CUSTOM[type];
    setDraft((d) => guardarCustom(d, campo, item, type === 'armadura' ? null : campo));
  };

  const steps = stepsDaFicha(draft);
  const passo = steps[step];
  const ultimo = step >= steps.length - 1;
  const tipo = tipoMestre(draft);
  /* Quando não há passo de Classe, o nome é pedido no Perfil. */
  const nomeNoPerfil = !steps.includes('Classe');

  const canNext =
    passo === 'Classe' ? draft.name.trim().length > 0 && !!draft.originId :
    passo === 'Perfil' && nomeNoPerfil ? draft.name.trim().length > 0 :
    /* No especial a subdivisão é opcional; nas fichas de jogador continua obrigatória. */
    passo === 'Herança' ? (tipo ? true : (
      origin?.subdivisao === 'animal' ? !!draft.subdivisaoAnimalTipo :
      origin?.subdivisao === 'nivel' ? true :
      !!draft.subdivisaoId
    )) : true;

  const save = async () => { setSaving(true); await onSave(draft); setSaving(false); };

  return (
    <div className="min-h-screen w-full" style={{ background: V.bg }}>
      <style>{FONTS}</style>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-80" style={{ color: V.muted, fontFamily: F.body }}>
          <ArrowLeft size={14} /> Voltar ao painel
        </button>
        <div className="flex flex-col sm:flex-row gap-6">
          <Stepper step={step} origin={origin} steps={steps} />
          <div className="flex-1 min-w-0">
            {tipo && (
              <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2.5" style={{ background: `${tipo.cor}14`, border: `1px solid ${tipo.cor}66` }}>
                <tipo.Icon size={16} color={tipo.cor} />
                <div className="min-w-0">
                  <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>Ficha de {tipo.nome.toLowerCase()}</p>
                  <p className="text-xs" style={{ fontFamily: F.body, color: V.muted }}>{tipo.frase}</p>
                </div>
              </div>
            )}
            <div className="rounded-2xl p-5 sm:p-6 mb-4" style={{ background: V.surface, border: `1px solid ${V.border}` }}>
              {passo === 'Classe' && <StepClasse draft={draft} setDraft={setDraft} />}
              {passo === 'Origem' && <StepNarrativa draft={draft} origin={origin} />}
              {passo === 'Herança' && <StepHeranca draft={draft} setDraft={setDraft} origin={origin} />}
              {passo === 'Perfil' && <StepPerfil draft={draft} setDraft={setDraft} origin={origin} comNome={nomeNoPerfil} />}
              {passo === 'Atributos' && <StepAtributos draft={draft} setDraft={setDraft} origin={origin} />}
              {passo === 'Perícias' && <StepPericias draft={draft} setDraft={setDraft} origin={origin} />}
              {(passo === 'Equipamento' || passo === 'Poderes') && <StepEquipamento draft={draft} setDraft={setDraft} origin={origin} account={account} content={content} onCreateContent={createContent} />}
              {passo === 'Revisão' && <CharacterSheetBody char={draft} contentIndex={content} />}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm disabled:opacity-30" style={{ color: V.muted, fontFamily: F.body, border: `1px solid ${V.border}` }}>
                <ChevronLeft size={15} /> Voltar
              </button>
              {!ultimo ? (
                <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={!canNext}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ background: origin ? origin.cor : V.brand, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>
                  Continuar <ChevronRight size={15} />
                </button>
              ) : (
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: origin ? origin.cor : V.brand, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar personagem
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Ficha salva (com edição pela mestra)
   ============================================================ */

/* A aba de Feitiços só existe para magos. Nos deuses, habilidades e feitiços
   se fundem numa aba só: Poderes Divinos. */
function abasDaFicha(char) {
  const base = [
    { id: 'ficha', nome: 'Ficha' },
    { id: 'pericias', nome: 'Perícias' },
    { id: 'combate', nome: 'Combate' },
  ];
  if (tipoMestre(char)?.poderesUnificados) {
    base.push({ id: 'poderes', nome: 'Poderes Divinos' });
  } else {
    base.push({ id: 'habilidades', nome: 'Habilidades' });
    if (char.originId === 'mago') base.push({ id: 'feiticos', nome: 'Feitiços' });
  }
  /* O druida carrega a ficha do animal-laço junto com a dele. */
  if (char.originId === 'druida') base.push({ id: 'animal', nome: 'Animal' });
  base.push({ id: 'inventario', nome: 'Inventário' });
  return base;
}

/* Lista de armas equipadas na ficha, com dano, teste e carga total */
function ListaArmas({ char, catalogo, color }) {
  const itens = (char.armas || []).map((id) => catalogo.find((x) => x.id === id)).filter(Boolean);
  const carga = pesoCarregado(char, catalogo.filter((a) => !ARMAS_CATALOGO.some((c) => c.id === a.id)));
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <Swords size={12} /> Armas
        </p>
        <span className="text-xs rounded-full px-2.5 py-1" style={{
          fontFamily: F.mono, background: '#171029',
          border: `1px solid ${carga.excedido ? '#e0577a' : V.border}`,
          color: carga.excedido ? '#e0577a' : V.muted,
        }}>
          carga {carga.total}/{carga.capacidade}
        </span>
      </div>
      {itens.length === 0 ? (
        <p className="text-xs italic" style={{ color: '#6f6291', fontFamily: F.body }}>Nenhuma arma equipada.</p>
      ) : (
        <div className="space-y-2">
          {itens.map((a) => (
            <div key={a.id} className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{a.nome}</p>
                <span className="text-sm shrink-0" style={{ fontFamily: F.mono, color }}>{a.dano || '—'}</span>
              </div>
              {a.descricao && <p className="text-xs mt-1 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{a.descricao}</p>}
              <p className="text-xs mt-1" style={{ fontFamily: F.body, color: '#6f6291' }}>
                {a.teste ? `Teste de ${a.teste}` : ''}{a.teste && a.peso !== undefined ? ' · ' : ''}{a.peso > 0 ? `peso ${a.peso}` : 'sem peso'}
              </p>
              <BotoesDeRolagem char={char} color={color} nome={a.nome} dano={a.dano} pericia={a.teste} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Painel de Defesa / Bloqueio / Esquiva, no formato da ficha do CRIS */
function PainelDefesas({ char, color, armadurasCustom = [] }) {
  const d = computeDefesas(char, armadurasCustom);
  const armaduraEquipada = [...ARMADURAS_CATALOGO, ...armadurasCustom].find((a) => a.id === char.armaduraId);
  const Bloco = ({ titulo, valor, formula, destaque }) => (
    <div className="rounded-lg p-3 text-center" style={{ background: '#171029', border: `1px solid ${destaque ? color : V.border}` }}>
      <p className="uppercase tracking-widest mb-1" style={{ fontSize: '10px', color: V.muted, fontFamily: F.body }}>{titulo}</p>
      <p style={{ fontFamily: F.mono, color: V.text, fontSize: '1.5rem', fontWeight: 600 }}>{valor}</p>
      <p className="mt-1" style={{ fontSize: '10px', color: '#6f6291', fontFamily: F.mono }}>{formula}</p>
    </div>
  );
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
        <Shield size={12} /> Defesas
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Bloco titulo="Defesa" valor={d.defesa} destaque
          formula={`10+${d.defesaPartes.atributo}${d.defesaPartes.equip ? `+${d.defesaPartes.equip}` : ''}${d.defesaPartes.outros ? `+${d.defesaPartes.outros}` : ''}`} />
        <Bloco titulo="Bloqueio" valor={d.bloqueio}
          formula={`${d.bloqueioPartes.resistencia}${d.bloqueioPartes.equip ? `+${d.bloqueioPartes.equip}` : ''}${d.bloqueioPartes.outros ? `+${d.bloqueioPartes.outros}` : ''}`} />
        <Bloco titulo="Esquiva" valor={d.esquiva}
          formula={`10+${d.esquivaPartes.atributo}+${d.esquivaPartes.treino}${d.esquivaPartes.equip ? `+${d.esquivaPartes.equip}` : ''}${d.esquivaPartes.outros ? `+${d.esquivaPartes.outros}` : ''}`} />
      </div>
      {armaduraEquipada && (
        <div className="rounded-lg p-3 mt-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{armaduraEquipada.nome}</p>
            <span className="text-xs shrink-0" style={{ fontFamily: F.mono, color }}>+{armaduraEquipada.defesa} def</span>
          </div>
          {armaduraEquipada.descricao && <p className="text-xs mt-0.5 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{armaduraEquipada.descricao}</p>}
        </div>
      )}
      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
        Defesa é o valor passivo (10 + Motoras + equipamento). Bloqueio e Esquiva são
        reações — uma por rodada. O Bloqueio vale o bônus de <strong style={{ color }}>Resistência</strong>,
        sem base 10 e sem atributo; a Esquiva soma 10 + Motoras + Velocidade de reação.
      </p>
    </div>
  );
}

/* Lista de itens (armas, habilidades, feitiços) resolvendo os IDs no catálogo global */
/* Ficha do animal-laço do druida. Nasce inteiramente vazia: nome, espécie,
   recursos e golpes são escritos à mão, porque cada laço é único e não existe
   catálogo de animais. Fica guardada dentro da própria ficha, em char.animal. */
const animalVazio = () => ({ nome: '', especie: '', descricao: '', vida: 0, sanidade: 0, notas: '', golpes: [] });

function FichaAnimal({ char, color, podeEditar, onSalvar }) {
  const [draft, setDraft] = useState(() => ({ ...animalVazio(), ...(char.animal || {}) }));
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => { setDraft({ ...animalVazio(), ...(char.animal || {}) }); setSalvo(false); }, [char.id]);

  const set = (campo, valor) => { setSalvo(false); setDraft((d) => ({ ...d, [campo]: valor })); };
  const golpes = draft.golpes || [];
  const setGolpe = (id, campo, valor) => set('golpes', golpes.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)));

  const salvar = async () => {
    setSalvando(true);
    await onSalvar(draft);
    setSalvando(false);
    setSalvo(true);
  };

  const campo = (rotulo, valor, aoMudar, extras = {}) => (
    <Field label={rotulo}>
      {podeEditar ? (
        <input value={valor} onChange={(e) => aoMudar(e.target.value)} {...extras}
          className="w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" style={inputStyle} />
      ) : (
        <p className="text-sm" style={{ fontFamily: F.body, color: valor ? V.text : '#6f6291' }}>{valor || '—'}</p>
      )}
    </Field>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <PawPrint size={13} /> Animal-laço
        </p>
        {podeEditar && (
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 disabled:opacity-60"
            style={{ background: color, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {salvo && !salvando ? 'Salvo' : 'Salvar animal'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
        {campo('Nome do animal', draft.nome, (v) => set('nome', v), { placeholder: 'Como você o chama' })}
        {campo('Espécie', draft.especie, (v) => set('especie', v), { placeholder: 'Corvo, lobo, algo que ninguém viu...' })}
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        {campo('Vida', draft.vida, (v) => set('vida', Math.max(0, Math.floor(Number(v) || 0))), { type: 'number', min: '0' })}
        {campo('Sanidade', draft.sanidade, (v) => set('sanidade', Math.max(0, Math.floor(Number(v) || 0))), { type: 'number', min: '0' })}
      </div>

      <Field label="Descrição">
        {podeEditar ? (
          <textarea value={draft.descricao} onChange={(e) => set('descricao', e.target.value)}
            placeholder="Como ele é, como o laço foi feito, o que ele carrega de você..."
            className="w-full rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 resize-none" style={{ ...inputStyle, minHeight: '90px' }} />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: F.body, color: draft.descricao ? V.text : '#6f6291' }}>{draft.descricao || '—'}</p>
        )}
      </Field>

      <div className="pt-2 mt-2 border-t" style={{ borderColor: V.border }}>
        <div className="flex items-center justify-between mb-2 mt-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: V.muted, fontFamily: F.body }}>Golpes</p>
          {podeEditar && (
            <button onClick={() => set('golpes', [...golpes, { id: uid(), nome: '', dano: '', teste: '', descricao: '' }])}
              className="text-xs flex items-center gap-1 rounded-full px-2.5 py-1" style={{ color, border: `1px solid ${color}88`, fontFamily: F.body }}>
              <Plus size={12} /> Novo golpe
            </button>
          )}
        </div>

        {golpes.length === 0 ? (
          <p className="text-xs italic" style={{ color: '#6f6291', fontFamily: F.body }}>Nenhum golpe ainda.</p>
        ) : (
          <div className="space-y-2">
            {golpes.map((g) => (
              <div key={g.id} className="rounded-lg p-2.5" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
                {podeEditar ? (
                  <>
                    <div className="flex gap-2 mb-2">
                      <input value={g.nome} onChange={(e) => setGolpe(g.id, 'nome', e.target.value)} placeholder="Nome do golpe"
                        className="flex-1 rounded-md px-2.5 py-2 outline-none text-sm" style={inputStyle} />
                      <button onClick={() => set('golpes', golpes.filter((x) => x.id !== g.id))}
                        className="w-9 rounded-md flex items-center justify-center shrink-0"
                        style={{ border: `1px solid ${V.border}`, color: '#e0577a' }} title="Remover golpe">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input value={g.dano} onChange={(e) => setGolpe(g.id, 'dano', e.target.value)} placeholder="Dano (ex: 1d8)"
                        className="flex-1 rounded-md px-2.5 py-2 outline-none text-sm" style={inputStyle} />
                      <input value={g.teste} onChange={(e) => setGolpe(g.id, 'teste', e.target.value)} placeholder="Teste (ex: Guerra)"
                        className="flex-1 rounded-md px-2.5 py-2 outline-none text-sm" style={inputStyle} />
                    </div>
                    <textarea value={g.descricao} onChange={(e) => setGolpe(g.id, 'descricao', e.target.value)} placeholder="O que o golpe faz, custo, condições..."
                      className="w-full rounded-md px-2.5 py-2 outline-none text-sm resize-none" style={{ ...inputStyle, minHeight: '54px' }} />
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{g.nome || 'Golpe sem nome'}</p>
                      {g.dano && <span className="text-xs shrink-0" style={{ fontFamily: F.mono, color }}>{g.dano}</span>}
                    </div>
                    {g.teste && <p className="text-xs mt-0.5" style={{ fontFamily: F.body, color: '#6f6291' }}>Teste de {g.teste}</p>}
                    {g.descricao && <p className="text-xs mt-1 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{g.descricao}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Field label="Anotações">
        {podeEditar ? (
          <textarea value={draft.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Bônus combinados com a mestra, limites, tudo o mais."
            className="w-full rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 resize-none" style={{ ...inputStyle, minHeight: '70px' }} />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: F.body, color: draft.notas ? V.text : '#6f6291' }}>{draft.notas || '—'}</p>
        )}
      </Field>
    </div>
  );
}

/* ---------- interface das rolagens ---------- */

/* Botão de rolar. Mostra o último resultado no próprio botão por alguns
   segundos, para quem rolou não precisar procurar no histórico. */
function BotaoRolar({ onRolar, color, titulo, compacto, rotulo }) {
  const [rolando, setRolando] = useState(false);
  const [ultimo, setUltimo] = useState(null);

  useEffect(() => {
    if (ultimo === null) return undefined;
    const t = setTimeout(() => setUltimo(null), 6000);
    return () => clearTimeout(t);
  }, [ultimo]);

  const clicar = async (e) => {
    e.stopPropagation();
    setRolando(true);
    try {
      const r = await onRolar();
      if (r && typeof r.total === 'number') setUltimo(r.total);
    } catch (err) { /* o painel de histórico mostra o estado real */ }
    setRolando(false);
  };

  return (
    <button onClick={clicar} disabled={rolando} title={titulo}
      className={`flex items-center justify-center gap-1 rounded-md transition-opacity hover:opacity-80 disabled:opacity-50 ${compacto ? 'w-8 h-7' : 'px-2.5 py-1'}`}
      style={{
        background: ultimo !== null ? color : 'transparent',
        border: `1px solid ${color}${ultimo !== null ? '' : '88'}`,
        color: ultimo !== null ? '#0d0a16' : color,
        fontFamily: F.mono, fontSize: '11px', fontWeight: ultimo !== null ? 700 : 400,
      }}>
      {rolando ? <Loader2 size={12} className="animate-spin" />
        : ultimo !== null ? ultimo
        : <><Dices size={12} />{!compacto && rotulo ? <span style={{ fontFamily: F.body }}>{rotulo}</span> : null}</>}
    </button>
  );
}

/* Botões de uma arma, habilidade ou feitiço. São dois papéis diferentes e por
   isso dois botões: o teste diz se acertou, o dano diz o quanto doeu. Cada um
   só aparece quando faz sentido — sem notação de dado, não há o que rolar. */
function BotoesDeRolagem({ char, color, nome, dano, pericia }) {
  const notacao = lerNotacao(dano);
  const p = pericia ? PERICIAS.find((x) => x.nome.toLowerCase() === String(pericia).toLowerCase()) : null;
  const m = p ? modificadorDoTeste(char, p) : null;
  if (!notacao && !m) return null;

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {m && (
        <BotaoRolar color={color} rotulo={`Teste · ${p.nome}`}
          titulo={`1d20 ${m.total >= 0 ? '+' : ''}${m.total}`}
          onRolar={() => rolarNoServidor({
            qtd: 1, faces: 20, modificador: m.total, categoria: 'pericia',
            rotulo: `${nome} — teste de ${p.nome}`, detalhe: detalheDoTeste(p, m), char,
          })} />
      )}
      {notacao && (
        <BotaoRolar color={color} rotulo={`Dano · ${notacao.texto}`} titulo={`Rolar ${notacao.texto}`}
          onRolar={() => rolarNoServidor({
            /* Sem detalhe: a notação já aparece no histórico, ao lado dos dados. */
            qtd: notacao.qtd, faces: notacao.faces, modificador: notacao.modificador,
            categoria: 'dano', rotulo: `${nome} — dano`, char,
          })} />
      )}
    </div>
  );
}

const horaDe = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/* Histórico das rolagens. O que aparece aqui já vem filtrado pelo servidor:
   a mestra recebe a mesa inteira, o jogador recebe só o que ele rolou. */
function HistoricoRolagens({ account, color, compacto, limite }) {
  const [rolagens, setRolagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [limpando, setLimpando] = useState(false);

  const carregar = useCallback(async () => {
    setRolagens(await lerRolagens());
    setCarregando(false);
  }, []);

  /* Atualiza sozinho: a mestra precisa ver a rolagem do jogador aparecer. */
  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 5000);
    return () => clearInterval(t);
  }, [carregar]);

  const limpar = async () => {
    setLimpando(true);
    try { await api('/rolls', { method: 'DELETE' }); } catch (e) { /* segue e recarrega */ }
    await carregar();
    setLimpando(false);
  };

  const lista = limite ? rolagens.slice(0, limite) : rolagens;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
          <Dices size={13} /> {account?.isMaster ? 'Rolagens da mesa' : 'Suas rolagens'}
        </p>
        {account?.isMaster && rolagens.length > 0 && (
          <button onClick={limpar} disabled={limpando} className="text-xs hover:opacity-80 disabled:opacity-50"
            style={{ color: '#e0577a', fontFamily: F.body }}>
            {limpando ? 'Limpando…' : 'Limpar'}
          </button>
        )}
      </div>

      {carregando ? (
        <p className="text-xs italic" style={{ color: '#6f6291', fontFamily: F.body }}>Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="text-xs italic leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
          Nenhuma rolagem ainda. Os botões de dado ficam ao lado de cada perícia, arma, habilidade e feitiço.
        </p>
      ) : (
        <div className={compacto ? 'space-y-1' : 'space-y-1.5'}>
          {lista.map((r) => (
            <div key={r.id} className="rounded-lg px-2.5 py-1.5 flex items-center gap-2.5"
              style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <span className="shrink-0 text-center" style={{ fontFamily: F.mono, color, fontSize: '1rem', fontWeight: 700, minWidth: '2.2rem' }}>
                {r.total}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs truncate" style={{ fontFamily: F.body, color: V.text }}>
                  {r.rotulo}
                  {account?.isMaster && r.charName ? <span style={{ color: V.muted }}> · {r.charName}</span> : null}
                </p>
                <p className="text-xs truncate" style={{ fontFamily: F.mono, color: '#6f6291' }}>
                  {r.dados ? `${r.dados.qtd}d${r.dados.faces}${r.dados.modificador ? ` ${r.dados.modificador > 0 ? '+' : '−'} ${Math.abs(r.dados.modificador)}` : ''}` : ''}
                  {r.dados?.valores?.length > 1 ? ` [${r.dados.valores.join(', ')}]` : ''}
                  {r.detalhe ? ` · ${r.detalhe}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-xs" style={{ fontFamily: F.mono, color: '#6f6291' }}>{horaDe(r.criadoEm)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Perícia com que o alvo resiste. Fica destacada abaixo da descrição porque é
   o que a mesa mais procura no meio de um combate. */
function LinhaResistencia({ texto, color }) {
  return (
    <p className="text-xs mt-1.5 flex items-start gap-1.5" style={{ fontFamily: F.body, color }}>
      <Shield size={11} className="shrink-0 mt-0.5" />
      <span>{texto}</span>
    </p>
  );
}

/* `detalhes` é um mapa id → texto curto, usado para mostrar a evolução do
   feitiço ao lado do nome sem mexer no catálogo. */
function ListaConteudo({ titulo, Icon, ids, catalogo, color, vazio, detalhes, descricoes, char, periciaDeLancamento }) {
  const itens = (ids || []).map((id) => catalogo.find((x) => x.id === id)).filter(Boolean);
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
        <Icon size={12} /> {titulo}
      </p>
      {itens.length === 0 ? (
        <p className="text-xs italic" style={{ color: '#6f6291', fontFamily: F.body }}>{vazio}</p>
      ) : (
        <div className="space-y-2">
          {itens.map((it) => (
            <div key={it.id} className="rounded-lg p-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{it.nome}</p>
                {detalhes?.[it.id] && (
                  <span className="text-xs shrink-0" style={{ fontFamily: F.mono, color }}>{detalhes[it.id]}</span>
                )}
              </div>
              {(descricoes?.[it.id] || it.descricao) && (
                <p className="text-xs mt-0.5 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>
                  {descricoes?.[it.id] || it.descricao}
                </p>
              )}
              {it.nota && (
                <p className="text-xs mt-1 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{it.nota}</p>
              )}
              {it.resistencia && <LinhaResistencia texto={it.resistencia} color={color} />}
              {char && (
                <BotoesDeRolagem char={char} color={color} nome={it.nome}
                  dano={descricoes?.[it.id] || it.descricao}
                  pericia={periciaDeLancamento} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SheetScreen({ char, account, onBack, onDelete, onSaveEdit }) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(char);
  const [saving, setSaving] = useState(false);
  const [contentIndex, setContentIndex] = useState(conteudoVazio());
  const [tab, setTab] = useState('ficha');
  const origin = originDaFicha(char);
  const isOwner = account.username === char.owner;
  const canEdit = account.isMaster || isOwner;

  const escopo = escopoDaFicha(char);

  const reloadContent = useCallback(async () => {
    setContentIndex(await carregarConteudo(escopo));
  }, [escopo]);

  useEffect(() => { reloadContent(); }, [reloadContent, char.id]);

  const createAndAttach = async (type, data) => {
    const { id, item } = montarConteudo(data, escopo);
    if (type === 'feitico') {
      await sSet(`content:${escopo}:${type}:${id}`, JSON.stringify(item));
      await reloadContent();
      setEditDraft((d) => ({ ...d, feiticos: [...(d.feiticos || []), { id, evolucao: 1 }] }));
      return;
    }
    const campo = CAMPO_CUSTOM[type];
    setEditDraft((d) => guardarCustom(d, campo, item, type === 'armadura' ? null : campo));
  };

  /* Alterar as barras salva na hora — não precisa entrar no modo de edição. */
  const alterarAtual = async (tipo, valor) => {
    const atualizado = { ...char, atual: { ...(char.atual || {}), [tipo]: valor } };
    await onSaveEdit(atualizado, { silencioso: true });
  };

  const restaurarTudo = async () => {
    await onSaveEdit({ ...char, atual: { vida: null, sanidade: null, mana: null } }, { silencioso: true });
  };

  const startEdit = () => { setEditDraft(char); setEditing(true); };
  const saveEdit = async () => {
    setSaving(true);
    const isMasterEditingOther = account.isMaster && !isOwner;
    await onSaveEdit({ ...editDraft, editedByMaster: isMasterEditingOther ? true : char.editedByMaster, editedAt: isMasterEditingOther ? Date.now() : char.editedAt });
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="min-h-screen w-full" style={{ background: V.bg }}>
        <style>{FONTS}</style>
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: V.muted, fontFamily: F.body }}>
              <X size={14} /> Cancelar edição
            </button>
            <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-2" style={{ background: origin.cor, color: '#0d0a16', fontFamily: F.body, fontWeight: 600 }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar edição
            </button>
          </div>
          <div className="rounded-2xl p-6" style={{ background: V.surface, border: `1px solid ${V.border}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <EnviarImagem valor={editDraft.fotoUrl} onChange={(v) => setEditDraft({ ...editDraft, fotoUrl: v })}
                color={origin.cor} rotulo="foto" Icone={Camera} redondo />
              <EnviarImagem valor={editDraft.marcaUrl} onChange={(v) => setEditDraft({ ...editDraft, marcaUrl: v })}
                color={origin.cor} rotulo="marca" Icone={Sparkles} dica="A marca que nasceu na sua pele." />
            </div>

            <Field label="Nome">
              <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle} />
            </Field>
            {!fichaLivre(editDraft) && (
              <Field label={`Nível (1 a ${NIVEL_CLASSE_MAX})`} hint="Define vida, sanidade, mana e quantos pontos de atributo e perícia cabem na ficha.">
                <input type="number" min={NIVEL_CLASSE_MIN} max={NIVEL_CLASSE_MAX} value={nivelDaFicha(editDraft)}
                  onChange={(e) => setEditDraft({ ...editDraft, nivel: clamp(Number(e.target.value) || NIVEL_CLASSE_MIN, NIVEL_CLASSE_MIN, NIVEL_CLASSE_MAX) })}
                  className="w-full rounded-lg px-3 py-2 outline-none" style={inputStyle} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {ATTRS.map((a) => (
                <Field key={a.key} label={a.nome}>
                  <input type="number" value={editDraft.attributes[a.key]}
                    onChange={(e) => setEditDraft({ ...editDraft, attributes: { ...editDraft.attributes,
                      /* Ficha da mestra não tem teto de atributo. */
                      [a.key]: fichaLivre(editDraft) ? Math.max(ATTR_MIN, Math.floor(Number(e.target.value) || 0)) : clamp(Number(e.target.value) || 0, ATTR_MIN, ATTR_MAX) } })}
                    className="w-full rounded-lg px-3 py-2 outline-none" style={inputStyle} />
                </Field>
              ))}
            </div>
            {fichaLivre(editDraft) ? (
              /* Sem fórmula: os máximos são digitados direto, sem teto. */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { campo: 'vidaMax', label: 'Vida máxima', cor: '#e0577a' },
                  { campo: 'sanidadeMax', label: 'Sanidade máxima', cor: '#caa24a' },
                  { campo: 'manaMax', label: 'Mana máxima', cor: '#8FB4F5' },
                ].map(({ campo, label, cor }) => (
                  <Field key={campo} label={label}>
                    <input type="number" min="0" value={editDraft.recursosLivres?.[campo] ?? 0}
                      onChange={(e) => setEditDraft({ ...editDraft, recursosLivres: { ...(editDraft.recursosLivres || {}), [campo]: Math.max(0, Math.floor(Number(e.target.value) || 0)) } })}
                      className="w-full rounded-lg px-3 py-2 outline-none" style={{ ...inputStyle, color: cor, fontFamily: F.mono }} />
                  </Field>
                ))}
              </div>
            ) : (
              <>
                <Field label="Bônus de vida (lore) — atribuído pela mestra">
                  <input type="number" value={editDraft.recursos?.vidaBonusLore || 0}
                    onChange={(e) => setEditDraft({ ...editDraft, recursos: { ...editDraft.recursos, vidaBonusLore: Number(e.target.value) || 0 } })}
                    className="w-full rounded-lg px-3 py-2 outline-none" style={inputStyle} />
                </Field>
                <Field label="Bônus de sanidade (lore) — atribuído pela mestra">
                  <input type="number" value={editDraft.recursos?.sanidadeBonusLore || 0}
                    onChange={(e) => setEditDraft({ ...editDraft, recursos: { ...editDraft.recursos, sanidadeBonusLore: Number(e.target.value) || 0 } })}
                    className="w-full rounded-lg px-3 py-2 outline-none" style={inputStyle} />
                </Field>
              </>
            )}
            <Field label="História">
              <textarea value={editDraft.historia} onChange={(e) => setEditDraft({ ...editDraft, historia: e.target.value })} className="w-full rounded-lg px-3 py-2.5 outline-none resize-none" style={{ ...inputStyle, minHeight: '120px' }} />
            </Field>

            <div className="pt-2 mt-2 border-t" style={{ borderColor: V.border }}>
              <p className="text-xs uppercase tracking-widest mb-3 mt-3 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
                <Shield size={12} /> Defesas
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { campo: 'equipamento', label: 'Equipamento (armadura)' },
                  { campo: 'defesaOutros', label: 'Defesa — outros' },
                  { campo: 'bloqueioOutros', label: 'Bloqueio — outros' },
                  { campo: 'esquivaOutros', label: 'Esquiva — outros' },
                ].map(({ campo, label }) => (
                  <Field key={campo} label={label}>
                    <input type="number" value={editDraft.defesas?.[campo] ?? 0}
                      onChange={(e) => setEditDraft({ ...editDraft, defesas: { ...(editDraft.defesas || {}), [campo]: Number(e.target.value) || 0 } })}
                      className="w-full rounded-lg px-3 py-2 outline-none" style={inputStyle} />
                  </Field>
                ))}
              </div>
              <div className="rounded-lg p-3 mb-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
                {(() => {
                  const d = computeDefesas(editDraft, catalogoDe(contentIndex, 'armaduras', [], editDraft));
                  return (
                    <p className="text-xs" style={{ fontFamily: F.mono, color: V.muted }}>
                      Defesa <span style={{ color: origin.cor }}>{d.defesa}</span> ·
                      Bloqueio <span style={{ color: origin.cor }}>{d.bloqueio}</span> ·
                      Esquiva <span style={{ color: origin.cor }}>{d.esquiva}</span>
                    </p>
                  );
                })()}
              </div>
            </div>

            <div className="pt-2 mt-2 border-t" style={{ borderColor: V.border }}>
              <p className="text-xs uppercase tracking-widest mb-3 mt-3" style={{ color: V.muted, fontFamily: F.body }}>Perícias</p>
              <TabelaPericias char={editDraft} color={origin.cor}
                onChangeGrau={(id, grau) => setEditDraft({ ...editDraft, pericias: { ...editDraft.pericias, [id]: grau } })}
                onChangeOutros={(id, val) => setEditDraft({ ...editDraft, periciasOutros: { ...editDraft.periciasOutros, [id]: val } })} />
            </div>

            <div className="pt-2 mt-4 border-t" style={{ borderColor: V.border }}>
              <p className="text-xs uppercase tracking-widest mb-3 mt-3" style={{ color: V.muted, fontFamily: F.body }}>Equipamento</p>
              <SeletorArmas char={editDraft} selecionadas={editDraft.armas || []}
                onToggle={(id) => setEditDraft({ ...editDraft, armas: (editDraft.armas || []).includes(id) ? editDraft.armas.filter((x) => x !== id) : [...(editDraft.armas || []), id] })}
                color={origin.cor} customs={customsDe(contentIndex, 'armas', editDraft.armas, account.isMaster, editDraft)}
                vazio={fichaLivre(editDraft) ? 'Nada criado ainda — use o botão abaixo.' : undefined}
                canCreate onCreate={(d) => createAndAttach('arma', d)} />
              <SeletorArmadura char={editDraft} equipada={editDraft.armaduraId}
                onSelect={(id) => setEditDraft({ ...editDraft, armaduraId: id })} color={origin.cor}
                customs={customsDe(contentIndex, 'armaduras', editDraft.armaduraId ? [editDraft.armaduraId] : [], account.isMaster, editDraft)}
                vazio={fichaLivre(editDraft) ? 'Nada criado ainda — use o botão abaixo.' : undefined}
                canCreate onCreate={(d) => createAndAttach('armadura', d)} />

              <SeletorHabilidades char={editDraft} selecionadas={editDraft.habilidades || []}
                onToggle={(id) => setEditDraft({ ...editDraft, habilidades: (editDraft.habilidades || []).includes(id) ? editDraft.habilidades.filter((x) => x !== id) : [...(editDraft.habilidades || []), id] })}
                color={origin.cor} customs={customsDe(contentIndex, 'habilidades', editDraft.habilidades, account.isMaster, editDraft)}
                titulo={tipoMestre(editDraft)?.poderesUnificados ? 'Poderes Divinos' : 'Habilidades'}
                rotuloCriar={tipoMestre(editDraft)?.poderesUnificados ? 'Criar poder divino' : 'Criar habilidade própria'}
                vazio={fichaLivre(editDraft) ? 'Nada criado ainda — use o botão abaixo.' : undefined}
                canCreate onCreate={(d) => createAndAttach('habilidade', d)} />

              {editDraft.originId === 'mago' && (
                <SeletorFeiticos nivelMagico={editDraft.subdivisaoNivel || NIVEL_MIN} selecionados={editDraft.feiticos || []}
                  onToggle={(id) => {
                    const atuais = editDraft.feiticos || [];
                    const jaTem = atuais.some((f) => feiticoId(f) === id);
                    setEditDraft({ ...editDraft, feiticos: jaTem ? atuais.filter((f) => feiticoId(f) !== id) : [...atuais, { id, evolucao: 1 }] });
                  }}
                  onEvolucao={(id, evo) => setEditDraft({ ...editDraft, feiticos: (editDraft.feiticos || []).map((f) => (feiticoId(f) === id ? { id, evolucao: evo } : f)) })}
                  vagas={fichaLivre(editDraft) ? undefined : vagasDeFeitico(editDraft)}
                  color={origin.cor} customs={customsDe(contentIndex, 'feiticos', idsDeFeiticos(editDraft.feiticos), account.isMaster)} semCatalogo={fichaLivre(editDraft)}
                  canCreate={account.isMaster} onCreate={(d) => createAndAttach('feitico', d)} />
              )}
            </div>

            <div className="pt-2 mt-4 border-t" style={{ borderColor: V.border }}>
              <div className="mt-3">
                <SeletorItens char={editDraft} inventario={editDraft.inventario || []}
                  onAdd={(item) => setEditDraft({ ...editDraft, inventario: [...(editDraft.inventario || []), item] })}
                  onRemove={(id) => setEditDraft({ ...editDraft, inventario: editDraft.inventario.filter((i) => i.id !== id) })}
                  color={origin.cor} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: V.bg }}>
      <style>{FONTS}</style>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: V.muted, fontFamily: F.body }}><ArrowLeft size={14} /> Painel</button>
          <div className="flex items-center gap-3">
            {canEdit && tab === 'ficha' && (
              <button onClick={restaurarTudo} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: V.muted, fontFamily: F.body }}
                title="Devolve vida, sanidade e mana ao máximo">
                <Sparkles size={14} /> Restaurar
              </button>
            )}
            {canEdit && <button onClick={startEdit} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: V.muted, fontFamily: F.body }}><Pencil size={14} /> Editar</button>}
            {canEdit && !confirming && <button onClick={() => setConfirming(true)} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: '#e0577a', fontFamily: F.body }}><Trash2 size={14} /> Excluir</button>}
            {confirming && (
              <div className="flex items-center gap-2 text-sm" style={{ fontFamily: F.body }}>
                <span style={{ color: V.muted }}>Certeza?</span>
                <button onClick={() => onDelete(char)} className="rounded px-2 py-1" style={{ background: '#e0577a', color: '#fff' }}>Sim</button>
                <button onClick={() => setConfirming(false)} className="rounded px-2 py-1" style={{ border: `1px solid ${V.border}`, color: V.muted }}>Não</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 mb-4 overflow-x-auto border-b" style={{ borderColor: V.border }}>
          {abasDaFicha(char).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="px-3 py-2 text-sm whitespace-nowrap transition-colors"
              style={{ fontFamily: F.body, color: tab === t.id ? origin.cor : V.muted,
                borderBottom: `2px solid ${tab === t.id ? origin.cor : 'transparent'}`, fontWeight: tab === t.id ? 600 : 400 }}>
              {t.nome}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-6" style={{ background: V.surface, border: `1px solid ${V.border}` }}>
          {tab === 'ficha' && <CharacterSheetBody char={char} contentIndex={contentIndex} onChangeAtual={canEdit ? alterarAtual : undefined} />}
          {tab === 'pericias' && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: V.muted, fontFamily: F.body }}>Perícias</p>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6f6291', fontFamily: F.body }}>
                Destreinado +0 · Treinado +2 · Veterano +4 · Expert +6. O botão de dado rola
                <strong style={{ color: origin.cor }}> 1d20</strong> somando o número da coluna Teste,
                que já inclui o atributo, o treino e os outros bônus.
              </p>
              <TabelaPericias char={char} color={origin.cor} readOnly podeRolar onChangeGrau={() => {}} />
              <div className="mt-5 pt-4 border-t" style={{ borderColor: V.border }}>
                <HistoricoRolagens account={account} color={origin.cor} compacto limite={6} />
              </div>
            </div>
          )}
          {tab === 'combate' && (
            <div>
              <PainelDefesas char={char} color={origin.cor} armadurasCustom={catalogoDe(contentIndex, 'armaduras', [], char)} />
              <ListaArmas char={char} catalogo={catalogoDe(contentIndex, 'armas', ARMAS_CATALOGO, char)} color={origin.cor} />
            </div>
          )}
          {tab === 'habilidades' && (
            <ListaConteudo titulo="Habilidades" Icon={Flame} ids={char.habilidades}
              catalogo={catalogoDe(contentIndex, 'habilidades', HABILIDADES_CATALOGO, char)}
              color={origin.cor} vazio="Nenhuma habilidade escolhida." char={char} />
          )}
          {tab === 'poderes' && (
            /* Deuses: uma lista só, juntando o que foi criado como habilidade
               e como feitiço, para não dividir o poder divino em duas abas. */
            <ListaConteudo titulo="Poderes Divinos" Icon={Flame}
              ids={[...(char.habilidades || []), ...idsDeFeiticos(char.feiticos)]}
              catalogo={[...catalogoDe(contentIndex, 'habilidades', HABILIDADES_CATALOGO, char), ...catalogoDe(contentIndex, 'feiticos', FEITICOS_CATALOGO)]}
              color={origin.cor} vazio="Nenhum poder divino criado ainda." char={char} />
          )}
          {tab === 'feiticos' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
                  <Wand2 size={12} /> Feitiços
                </p>
                <span className="text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5" style={{ fontFamily: F.mono, background: '#171029', border: `1px solid ${V.border}`, color: origin.corClara }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: markColor(origin, char), border: '1px solid #463a6e' }} />
                  nível {char.subdivisaoNivel}{char.subdivisaoNivel === NIVEL_MAX ? ' · mago negro' : ''}
                </span>
              </div>
              <div className="rounded-lg p-3 mb-3" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
                <p className="text-xs leading-relaxed" style={{ color: V.muted, fontFamily: F.body }}>
                  Todo feitiço é lançado com um teste de <strong style={{ color: origin.cor }}>Dicionário mental</strong>,
                  qualquer que seja o feitiço ou a evolução. A perícia de resistência mostrada em cada
                  um é a do alvo, não a sua.
                </p>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: V.muted, fontFamily: F.body }}>
                  A mana só é gasta ao conjurar <strong style={{ color: origin.cor }}>rituais</strong>.
                </p>
              </div>
              <ListaConteudo titulo="Conhecidos" Icon={Wand2} ids={idsDeFeiticos(char.feiticos)}
                detalhes={detalhesDeFeiticos(char.feiticos)}
                descricoes={descricoesDeFeiticos(char.feiticos, catalogoDe(contentIndex, 'feiticos', FEITICOS_CATALOGO))}
                catalogo={catalogoDe(contentIndex, 'feiticos', FEITICOS_CATALOGO)} color={origin.cor} vazio="Nenhum feitiço conhecido."
                char={char} periciaDeLancamento="Dicionário mental" />
            </div>
          )}
          {tab === 'animal' && (
            <FichaAnimal char={char} color={origin.cor} podeEditar={canEdit}
              onSalvar={(animal) => onSaveEdit({ ...char, animal }, { silencioso: true })} />
          )}
          {tab === 'inventario' && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: V.muted, fontFamily: F.body }}>
                <Backpack size={12} /> Inventário
              </p>
              {(char.inventario || []).length === 0 ? (
                <p className="text-xs italic" style={{ color: '#6f6291', fontFamily: F.body }}>Inventário vazio.</p>
              ) : (
                <div className="space-y-1.5">
                  {char.inventario.map((it) => (
                    <div key={it.id} className="rounded-lg px-3 py-2" style={{ background: '#171029', border: `1px solid ${V.border}` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm" style={{ fontFamily: F.body, color: V.text, fontWeight: 600 }}>{it.nome}</span>
                        <span className="text-sm shrink-0" style={{ fontFamily: F.mono, color: V.muted }}>×{it.quantidade}</span>
                      </div>
                      {it.descricao && <p className="text-xs mt-1 leading-relaxed" style={{ fontFamily: F.body, color: V.muted }}>{it.descricao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   App raiz
   ============================================================ */

export default function App() {
  const [booting, setBooting] = useState(true);
  const [account, setAccount] = useState(null);
  const [screen, setScreen] = useState('auth');
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [viewingChar, setViewingChar] = useState(null);
  const [dicionarioInicial, setDicionarioInicial] = useState('geral');
  const [novoTipo, setNovoTipo] = useState(null); // deus, inimigo, especial ou null

  const loadCharacters = useCallback(async (acc) => {
    setLoadingChars(true);
    const prefix = acc.isMaster ? 'char:' : `char:${acc.username}:`;
    const keys = await sList(prefix, true);
    const chars = [];
    for (const k of keys) {
      const raw = await sGet(k, true);
      if (raw) { try { chars.push(JSON.parse(raw)); } catch (e) {} }
    }
    chars.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setCharacters(chars);
    setLoadingChars(false);
  }, []);

  useEffect(() => {
    (async () => {
      // Restaura a sessão a partir do cookie, se ele ainda for válido.
      try {
        const acc = await api('/auth/me');
        if (acc) {
          setAccount(acc); setScreen('dashboard');
          await loadCharacters(acc);
        }
      } catch (e) { /* segue para a tela de login */ }
      setBooting(false);
    })();
  }, [loadCharacters]);

  const handleAuth = async (acc) => { setAccount(acc); setScreen('dashboard'); await loadCharacters(acc); };
  const handleLogout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch (e) { /* limpa o estado local mesmo assim */ }
    setAccount(null); setCharacters([]); setScreen('auth');
  };

  const handleSaveDraft = async (draft, opcoes = {}) => {
    const id = draft.id || uid();
    const charObj = { ...draft, id, createdAt: draft.createdAt || Date.now() };
    // atualiza a tela na hora; a gravação segue em segundo plano
    setViewingChar(charObj);
    await sSet(`char:${charObj.owner}:${id}`, JSON.stringify(charObj), true);
    await loadCharacters(account);
    if (!opcoes.silencioso) setScreen('sheet');
  };

  const handleDelete = async (char) => {
    await sDel(`char:${char.owner}:${char.id}`, true);
    await loadCharacters(account);
    setScreen('dashboard');
  };

  if (booting) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: V.bg }}>
        <style>{FONTS}</style>
        <Loader2 size={22} className="animate-spin" style={{ color: V.brand }} />
      </div>
    );
  }

  if (screen === 'auth' || !account) return <AuthScreen onAuth={handleAuth} />;
  if (screen === 'create') return <CreateWizard account={account} tipoFicha={novoTipo} onSave={handleSaveDraft} onCancel={() => setScreen('dashboard')} />;
  if (screen === 'dicionarios') return <DicionariosScreen onBack={() => setScreen('dashboard')} inicial={dicionarioInicial} />;
  if (screen === 'sheet' && viewingChar) {
    return <SheetScreen char={viewingChar} account={account} onBack={() => setScreen('dashboard')} onDelete={handleDelete} onSaveEdit={handleSaveDraft} />;
  }

  return (
    <Dashboard account={account} characters={characters} loading={loadingChars}
      onNew={(tipo) => {
        // Só a mestra abre o wizard nos tipos especiais; o servidor recusa o resto.
        setNovoTipo(account.isMaster && TIPOS_MESTRE_IDS.includes(tipo) ? tipo : null);
        setScreen('create');
      }}
      onOpen={(c) => { setViewingChar(c); setScreen('sheet'); }} onLogout={handleLogout}
      onDicionarios={() => { setDicionarioInicial('geral'); setScreen('dicionarios'); }} />
  );
}
