# Terarpeqá — guia do projeto

Ficha de personagem para uma mesa de RPG caseira. Este arquivo é o resumo do que
já foi combinado e decidido, para uma sessão nova não precisar redescobrir nada.

---

## Como falar com o usuário

- **Responda em português.** Comentários de código também em português.
- **Ele não roda comandos de git.** Eu commito e dou push ao terminar cada
  alteração, e relato o commit. Um `git pull` quase nunca é necessário: a pasta
  que eu edito é a mesma que ele usa (`C:\Users\nekro\Desktop\Site`), então o
  que eu salvo já está no disco dele. Só sincronizar se o remoto tiver andado
  sozinho.
- **O PowerShell dele bloqueia o `npm`** por política de execução
  (`npm.ps1` → `PSSecurityException`). Comando destinado a ele deve chamar
  `node caminho/do.mjs` direto. Pelo Bash que eu uso, `npm` funciona normal.
- Ele costuma pedir "suba no repositório" ao fim de cada tarefa.

## Fluxo de trabalho esperado

1. Alterar o código.
2. `npm run build` para validar.
3. **Testar de verdade** antes de subir: subir API + Vite localmente e conferir
   no navegador, e rodar os testes de API quando o servidor mudou. O usuário
   confia nesse passo; não afirmar que algo funciona sem ter visto funcionar.
4. Commit + push.
5. **Acompanhar o deploy** comparando o nome do bundle publicado com o do build
   local, e conferir `/api/health`. O Render publica sozinho a cada push.

```bash
# subir o ambiente local (banco embutido, nada para instalar)
rm -rf .pgdata
DATABASE_URL="pglite:./.pgdata" SESSION_SECRET="qualquer-coisa-longa" PORT=3001 node server/index.js &
npx vite --port 5173 &
```

---

## Arquitetura

- **Front**: React + Vite, num arquivo só: `src/App.jsx` (~5.000 linhas).
  Estilo inline + Tailwind. Sem router: a navegação é estado (`screen`).
  **Largura das telas**: todas usam a constante `TELA`, nunca um `max-w-` na
  mão. Ela cresce por degraus — tela cheia no celular, 896px, 1152px no `xl` e
  1280px no `2xl`. O site ficou travado em 896px (e a ficha em 672px) até
  08/10/2026, o que num monitor de 1600 deixava quase metade da tela vazia.
  Quem ganha espaço são as COLUNAS, não a linha de texto: o painel vai a três
  fichas por linha no `xl`, as condições a duas, e a coluna de texto do
  dicionário tem teto próprio (`max-w-3xl`) para a linha não esticar.
- **API**: Express em `server/index.js`, Postgres em `server/db.js`.
  Um único serviço serve a API e os arquivos estáticos de `dist/`.
- **Banco**: `DATABASE_URL` aceita dois formatos.
  - `pglite:./.pgdata` → Postgres dentro do próprio processo (desenvolvimento).
  - `postgres://...` → Postgres de verdade (produção, **Neon**).
- **Deploy**: Render, descrito em `render.yaml` (Blueprint). Plano gratuito.
  **O banco não está no Blueprint**: desde 01/10/2026 ele é um projeto do Neon,
  criado à mão, e o `DATABASE_URL` fica só no painel do Render (Environment),
  marcado como `sync: false`. Tirar esse `sync: false` ou devolver um bloco
  `databases:` ao `render.yaml` faria o Render apontar para um banco dele de
  novo — que é justamente o que expira.
- **Produção**: https://terarpeqa.onrender.com — hiberna após 15 min parado, e
  o primeiro acesso depois disso demora cerca de 1 minuto.

### Tabelas

| Tabela | Conteúdo |
| --- | --- |
| `accounts` | contas, senha em hash bcrypt, `is_master` |
| `kv` | fichas (`char:<dono>:<id>`) e conteúdo da mestra (`content:<escopo>:<tipo>:<id>`) |
| `rolls` | histórico de rolagens, podado nas 300 mais recentes |

O schema é criado no start. **Coluna nova exige `ALTER TABLE ... ADD COLUMN IF
NOT EXISTS`**: o `CREATE TABLE IF NOT EXISTS` não mexe em tabela existente, e a
produção já tem as tabelas.

### Permissões (aplicadas no servidor, nunca só no navegador)

- `char:<dono>:*` — o dono e a mestra; mais ninguém.
- `content:<escopo>:*` — escopo `jogador` todos leem; `deus`, `inimigo` e
  `especial` só a mestra. Escrever, só a mestra.
- Ficha com `tipoFicha` de mestra só pode ser gravada pela mestra.
- Rolagens: a mestra vê a mesa inteira, o jogador vê só as dele. O dono sai da
  sessão, não do corpo da requisição.
- **A primeira conta cadastrada vira a mestra.**

---

## Regras do jogo (estado atual)

### Atributos
Intelecto, Psique, Físico, Motoras. Começam em **0**, máximo 5.
Cada ponto vale **8** de vida (Físico), 8 de sanidade (Psique) ou 1 de Defesa e
1 de Esquiva (Motoras). Era 12 e caiu para 8 em 26/09/2026: com 12, quatro
pontos de Físico valiam quase quatro golpes de arma e o combate não acabava.
Pontos: **4 no nível 1**, mais 1 nos níveis **3, 5, 7 e 9**, mais 2 no **10**
(total 10). Tabela `GANHO_ATRIBUTO_POR_NIVEL`.

### Níveis
Todas as classes têm nível **1 a 10** (`char.nivel`). O mago tem, além disso, o
**nível mágico 5 a 100** (`char.subdivisaoNivel`), que governa feitiços e mana.

### Perícias
23 perícias, graus **Destreinado 0 · Treinado +2 · Veterano +4 · Expert +6**.
Orçamento: `4 + 2 × (nível − 1)` degraus. Perícia dada pela classe já vem no
Treinado e não custa degrau.

**Teto por nível** (`FAIXAS_DE_TREINO`): do nível 1 ao 4 o máximo é o Treinado,
do 5 ao 8 abre o Veterano, do 9 em diante o Expert. Ter degrau sobrando não
basta. O teto é aplicado em `grauDaPericia`, então vale para teste, Bloqueio e
Esquiva de uma vez; na interface os graus acima do teto aparecem travados com o
nível que os libera. O grau escolhido **continua guardado** na ficha acima do
teto: quem sobe de nível recupera o bônus, quem é rebaixado pela mestra perde o
bônus mas não a escolha. Ficha de mestra não tem teto.

**Teste = 1d20 + atributo + bônus da perícia** (treino + outros).
O bônus da perícia em si **não** inclui o atributo, porque é ele que define o
Bloqueio — mexer nisso quebra o Bloqueio.

A classe **Criatura do Mar** (antiga "Sereia / Tritão", renomeada em
25/09/2026) mantém o id `sereia`: sereia e tritão são só as subclasses dela.
Trocar o id quebraria todas as fichas salvas, as armas e as habilidades.

Perícias dadas pela classe: druida → Ágape; mago → Savoir-faire e Dicionário
mental. Os `id` das perícias nunca mudam (são a chave do treino nas fichas
salvas); renomear é só trocar o `nome`. Ex.: "Percepção" ainda tem id `logica`,
"Guerra" ainda tem id `limiar_dor`.

### Vida, sanidade e mana
```
vida     = classe.vidaBase + vidaPorNivel × (nível−1) + subdivisão + Físico×8 + ganho do nível mágico + bônus de lore
sanidade = classe.sanBase + reserva de habilidades + sanPorNivel × (nível−1) + subdivisão + Psique×8 + ganho do nível mágico + bônus de lore
mana     = nível mágico   (só mago; nível mágico 35 = 35 de mana)
```
Vida, sanidade e **Defesa base** saem do mesmo orçamento: **60 pontos por
classe**, contando 1 por vida, 1 por sanidade e **2 por ponto de Defesa acima
de 8**. Guerreiro 36/14/13, pirata 32/20/12, criatura do mar 30/24/11, druida 30/26/10,
nascido de ouro 26/28/11, mago 22/36/9. Cada subdivisão distribui mais 6 pontos
na mesma moeda (ensanguentado, por exemplo, compra 2 de Defesa). Por nível,
vida + sanidade continuam somando 9. `balancoConferido()` fecha essa conta e
avisa no console em desenvolvimento se alguma linha sair do orçamento.

A **reserva de habilidades** é a parte da sanidade que vem do que as
habilidades custam: a média das **3 mais caras** daquela classe + subdivisão,
vezes 2 (duas ativações típicas por cena). Era a mediana de todas, e isso fazia
habilidade barata nova **abaixar** a sanidade de quem a recebia. Ela é **lida do texto
das habilidades** por `custoSanidadeDaHabilidade` — quem escrever "Gasta 12 de
sanidade" numa habilidade nova já muda a conta sozinho. O regex exige a palavra
"gasta" antes do número, senão "recupera 3d10 de sanidade" viraria custo.

Consequência a conhecer: druida místico e dono da coroa passam o mago em
sanidade total, porque as habilidades deles são as mais caras da mesa. O mago
lidera a parte da classe (36), não a reserva (12, ele gasta mana).

**Sanidade zero** (regra escrita em 26/09/2026): cai inconsciente na hora,
acorda no fim da cena com a condição **Depressivo** e recupera metade da
sanidade numa noite inteira de descanso. Em zero não dá para usar habilidade.

### Defesas
```
Defesa   = base da classe + subdivisão + Motoras + equipamento + outros
Bloqueio = bônus de Resistência × 2 + equipamento + outros
Esquiva  = 10 + Motoras + treino de Velocidade de reação + equipamento + outros
```
A Defesa já foi cortada em 25% no fim da conta; o usuário pediu o valor cheio
de volta em 12/09/2026, e hoje ela vale a soma inteira.

Motoras contou **dobrado** na Defesa entre 12/09 e 26/09/2026. Voltou a contar
uma vez: com o dobro, a Defesa crescia 10 pontos do nível 1 ao 10 enquanto o
ataque crescia 5, e ninguém acertava ninguém no nível alto.

**O que cada reação faz** (escrito em 26/09/2026, antes era só o número):
uma reação por rodada; a **Esquiva** entra no lugar da Defesa como DT daquele
ataque; o **Bloqueio** abate o próprio valor do dano que passou.
Ficha sem classe (deus, inimigo) usa a base 10 do `BALANCO_PADRAO`.

### Feitiços
29 feitiços, 19 com **evoluções**; os outros mostram "Esse feitiço não tem
evoluções disponíveis". Quase todos evoluem em três, mas a **Sangria Arcana só
tem duas**: por isso `temEvolucoes` aceita qualquer array com mais de uma, e os
botões de evolução vêm do tamanho do array, não de [1,2,3] fixo. A evolução
escolhida é o custo em vagas (I=1, II=2, III=3).
Vagas: `2 + ⌊nível mágico ÷ 10⌋`.

**Dano de feitiço cresce com o nível mágico** (29/09/2026): o feitiço marcado
com `escala: true` soma `⌊nível mágico ÷ 10⌋` ao dano, do mesmo jeito que a arma
soma metade do nível. São 13 hoje. Ficam de fora **Espírito incandescente** e
**Forjador Mortífero**, que só emprestam dados para o ataque de outra pessoa (e
aquele ataque já soma o nível da arma), e o **Baralho dos Mortos**, cujo dado
sorteia a carta. Sem isso não havia curva nenhuma: a correlação entre nível do
feitiço e dano era 0,21 — um feitiço de nível 20 batia igual a um de nível 80.
Quem soma é a prop `bonusMagico` do botão, e a aba de feitiços mostra o valor.

**Feitiço com tabela**: o campo opcional `tabela` ([{ carta, efeito }]) desenha
uma tabela no card, na escolha e na ficha. Hoje só o **Baralho dos Mortos**
(nível 40) usa: ele rola 1d20 e lê a carta, e exige o item de mesmo nome no
inventário (o requisito está no campo `nota`).
Todo feitiço é lançado com **Dicionário mental**. Mana só é gasta em rituais.

**DT para resistir** = `12 + ⌊nível mágico do personagem ÷ 10⌋ + ⌊nível do feitiço ÷ 5⌋`.
Mago de nível mágico 35 lançando um feitiço de nível 20 exige DT 19. A conta
mudou em 26/09/2026: com a antiga (base 10 e ÷10 nos dois), um feitiço de nível
20 ficava em DT 14 e quase todo mundo resistia. Aparece já
calculada na aba de feitiços da ficha, ao lado da perícia de resistência, e só
nos feitiços que têm o campo `resistencia` — os outros não mostram DT nenhuma.
O nível de cada feitiço também aparece nessa aba, não só na tela de edição.
`char.feiticos` guarda `{ id, evolucao }`; ficha antiga guarda só a string do id
e é lida como evolução I.

**As evoluções são cumulativas** (07/10/2026): quem escolhe a III também sabe a I
e a II, e a aba de feitiços mostra as três, cada uma com o seu texto e os seus
botões de teste e dano. É o que justifica a III custar três vagas.
`descricoesDeFeiticos` devolve uma lista de `{ rotulo, texto }` quando o feitiço
evolui, e `ListaConteudo` desenha um bloco por evolução.

### Rolagem de dados
**Os dados rolam no servidor** (`POST /api/rolls`), nunca no navegador: numa
mesa em que a mestra vê o histórico de todos, um total vindo do cliente seria
só uma sugestão. Botões ao lado de cada perícia, arma, habilidade e feitiço.
Armas têm dois botões: teste e dano.

**Dano de arma** = dado + atributo da perícia do ataque + ⌊nível ÷ 2⌋
(desde 26/09/2026). **Feitiço de dano** soma ⌊nível mágico ÷ 10⌋ (desde
29/09/2026, prop `bonusMagico`). Habilidade, item e golpe de animal **não**
somam nada: lá o dado escrito já é o efeito inteiro. Quem soma é o botão, com as
props `armado` e `bonusMagico`; o rótulo é "Dano" em arma e "Rolar" no resto.

**Crítico** (só armas): dado bruto do ataque ≥ **18**, sem atributo nem bônus,
faz o golpe seguinte sair no **dano máximo** — cada dado no valor mais alto, sem
rolar (3d10 crítico = 30, mais o modificador). Quem monta esse valor é o
servidor; o cliente só avisa que o golpe está crítico. A marca se apaga depois
do dano.

### Inimigos prontos
`INIMIGOS_PRONTOS` tem 16 fichas fechadas em quatro categorias
(`CATEGORIAS_INIMIGO`): NPC, boss médio, boss forte e boss final. O painel mostra
o catálogo só na aba de Inimigos, e o botão de criar inimigo à mão **continua
onde estava** — o catálogo é atalho, não substituição. `fichaDeInimigo` expande o
modelo compacto numa ficha de verdade e `handleSaveDraft` salva.

A vida foi calibrada pelo dano real: grupo de 4 no nível 5 entrega perto de 50
por rodada (mediana 13,5 do dado + atributo 3 + metade do nível, acertando em
70%). Daí NPC 45 a 60 de vida, médio 150 a 175, forte 250 a 300 e final 400 a
450. A `defesa` do modelo é o número cheio; a fábrica desconta a base 10 e as
Motoras e guarda o resto em `defesaOutros`.

### Abas da ficha
Desde 08/10/2026 a ficha tem **menos abas, cada uma usando a largura**. A régua
é: o que cabe na tela sem rolar entra junto; o que estoura continua em aba
própria. Medido a 1440x900 com um guerreiro nível 10 cheio (história longa, 4
habilidades, inventário, histórico com rolagens):

| Aba | Conteúdo | Altura | Rola? |
| --- | --- | --- | --- |
| Ficha | identidade, barras, atributos, história, defesas **+ as 23 perícias** | 728px | não |
| Combate | armas **+ inventário + histórico de rolagens** | 578px | não |
| Habilidades | as habilidades inteiras | 501px | não |
| Ira / Contratos | poderes de classe | 557px | não |
| Condições | as 11 condições | 1534px | **sim** |

O que tornou a fusão possível: `TabelaPericias` ganhou `duasColunas`, que
divide os quatro grupos de atributo em duas colunas a partir do `xl` e repete
o cabeçalho em cada uma — a tabela caiu de 1294px para 603px. Só na ficha
salva: na criação as colunas têm campos de edição e ficariam estreitas demais.

`CharacterSheetBody` ganhou `compacto`, usado só na aba Ficha: tira as listas
que repetiam o nome do que já aparece inteiro em outra aba (armas,
habilidades, feitiços, inventário) e as perícias treinadas, que agora estão em
tabela cheia ao lado. A revisão da criação continua passando sem `compacto`,
porque lá o resumo é o ponto. A história ganha teto de `max-h-24` com rolagem
própria no modo compacto: uma história longa empurrava a página inteira.

As defesas saíram de Combate e foram para a Ficha, ao lado das barras: Defesa,
Bloqueio e Esquiva são o que a mesa mais pergunta, e agora estão na aba que
abre por padrão. No modo compacto elas não repetem o parágrafo que explica o
que cada uma faz — era o que sobrava de altura para as barras empilharem.

**Armadilha do `sm:` dentro de coluna estreita**: o breakpoint do Tailwind olha
a largura da JANELA, não a do elemento. As barras com `sm:grid-cols-3` ficaram
lado a lado e ilegíveis dentro da coluna de 304px da aba Ficha, porque numa
tela de desktop o `sm:` dispara de qualquer jeito. Por isso o `compacto` tira
as colunas em vez de confiar no breakpoint. Vale para qualquer grid novo que
for parar numa coluna estreita.

### Fichas da mestra
`tipoFicha` ∈ `deus`, `inimigo`, `especial`. Sem fórmula: vida, sanidade e mana
nascem em 0 e são digitadas; atributos sem teto; as 23 perícias livres; nenhum
catálogo pré-carregado. Deus funde habilidades e feitiços em "Poderes Divinos".
Especial escolhe uma classe; deus e inimigo não têm classe.

### Poderes de classe: Ira e Contrato de vida
Guerreiro e criatura do mar ganham um poder a cada dois níveis (1, 3, 5, 7 e 9),
em `PODERES_POR_NIVEL`. Eles **não ocupam vaga** e ficam fora de
`HABILIDADES_CATALOGO` de propósito: a reserva de sanidade é a média das três
habilidades mais caras da classe, e poder caro ali dentro inflaria a sanidade de
todo mundo. O preço sai do texto, como o custo de sanidade já sai.

**IRA** (só guerreiro): a única barra que **enche** em vez de esvaziar. Começa em
zero — por isso usa `iraAtual`, e não `valorAtual`, que trata null como cheio.
Máximo = `10 + 3 × (Físico + Psique)`. Psique entra porque é o que segura a
fúria: quem despeja tudo em Físico tem barra curta e perde o controle antes.
Barra cheia = condição **Em ira**. Zera no Restaurar. "Acumula N de ira" é lido
por `ganhoDeIra`.

Os custos sobem com o nível: 4, 6, 8, 10 e **20**. O salto no nível 9 é
proposital — **Nenhuma palavra te alcança** (09/10/2026) dá imunidade total a
magia pelo combate inteiro, inclusive à dos aliados, e come 71% de uma barra
típica de 28. Depois dela cabe mais uma habilidade pequena antes de virar
EM IRA, então usá-la é decidir o combate inteiro de uma vez. Ela substituiu
"A fúria é a arma", que custava 12 e dava dano máximo no golpe seguinte.

**Contrato de vida** (só criatura do mar): não cria barra, cobra da vida. "Custa
N de vida" e "Custa N de vida permanente" saem de `custoDeVidaDoPoder`. O
permanente vai para `char.recursos.vidaPerdida`, que `computeRecursos` desconta
do máximo (nunca abaixo de 1), e a aba tem o seletor de −5/+5.

### Habilidades: vagas e automáticas
**Vagas** (`vagasDeHabilidade`): 2 no nível 1 e mais 1 a cada 2 níveis, 6 no
nível 10. Antes não havia limite nenhum. Ficha de mestra não tem limite.

**Automáticas** (`HABILIDADES_AUTOMATICAS`): a classe dá algumas de graça, já
marcadas, sem ocupar vaga e sem poder desmarcar. Druida ganha *Faço de ti meu
laço* e a *Metamorfose* do tipo de animal dele; pirata ganha *Porão sem fundo*,
que **dobra a carga** (a conta está em `pesoCarregado`). Elas aparecem com
estrela no seletor e entram em `habilidadesDaFicha`, não em `char.habilidades`.

### Itens
**Item trancado** (08/10/2026): o campo `bloqueado` guarda a mensagem que o
jogador vê, e o item some do catálogo até a ficha ganhar o id em
`char.desbloqueados`. O botão "Desbloquear" fica no seletor de itens, dentro
da edição da ficha. Hoje só o **Baralho dos Mortos** usa — é a mestra que
libera, em jogo. É diferente da trava de mago negro (`nivelMin: 'negro'`),
que depende do nível e não de um clique.

Item **sem `classe`** é geral e aparece para todo mundo (11 hoje: lampião,
corda, pederneira...). O pirata é a classe de item: tem 19, entre os antigos e
os novos (rede, armadilha de urso, pólvora, luneta, piche, gancho). Item com
notação de dado no texto ganha botão de rolagem no inventário.

### Conteúdo criado na ficha
Armas, armaduras e habilidades criadas de dentro de uma ficha ficam **nela**
(`char.custom`), não em lugar compartilhado. Feitiço é a exceção: continua vindo
do catálogo da mestra.

### Outros
- Druida tem aba **Animal** com os animais prontos do `ANIMAIS_CATALOGO`
  (10 naturais, 5 místicos). Laço natural escolhe **um animal por nível de
  personagem**; laço místico escolhe **um só**. Os místicos tiveram nível mínimo
  entre 26/09 e 07/10/2026 e o usuário pediu para tirar: hoje todos aparecem
  selecionáveis desde o nível 1. A escolha é uma **etapa da criação da ficha**
  (passo "Animais", depois de Perícias, porque o limite do laço natural depende
  do nível escolhido em Atributos), e continua editável na aba Animal.
  **DT de Ágape para entrar na forma** = 10 + o custo por turno do animal.
  **DT de resistência de cada golpe** = 10 + metade do custo em conexão dele,
  e cada golpe diz com qual perícia o alvo resiste (campo `resiste`). A ficha guarda só os ids em
  `char.animais`; a vida atual de cada animal fica em
  `char.atual['animal:<id>']` e a conexão em `char.atual['conexao:<id>']`,
  então o Restaurar enche os dois junto.
- **Pontos de conexão** (só nas fichas de animal): golpes e habilidades do
  animal gastam **conexão**, não sanidade. A sanidade continua pagando a
  transformação e o custo por turno da forma. Cada animal tem a sua barra, e o
  máximo é a **soma do que as ações dele custam** (`conexaoMaxima`, lida do
  texto): natural 18 a 39, místico 38 a 86. Conexão zerada expulsa o druida da
  forma; vida do animal zerada desfaz o laço para sempre. A aba avisa nos dois
  casos, mas não mexe na ficha sozinha — quem desfaz o laço é o jogador.
  Na forma animal **a ficha do druida é ignorada** (decisão do usuário em
  13/09/2026): golpes e habilidades rolam com `fichaDaFormaAnimal`, que tem só
  o que o animal concede nos atributos, sem classe, treino nem bônus de perícia.
  Rharo em Instrumento físico rola 1d20 +3; em Ágape, 1d20 puro. Dano,
  perícia do teste e custo são lidos do texto; "teste de X para não cair" é
  teste do alvo e não ganha botão. Se o nível baixar, os animais a mais ficam e
  a aba avisa. A ficha antiga feita à mão (`char.animal`) só aparece se tiver
  conteúdo, como leitura.
- **Condições** (`CONDICOES`): aba em toda ficha e botão no painel, em ordem
  alfabética. São 11, com os textos oficiais da mestra (só a redação acertada):
  Catástrofe, Cego, Depressivo, Desnorteado, Doente, Em chamas, Em ira,
  Enfeitiçado, Exausto, Imóvel e Sangrando. Exausto guarda os níveis em
  `niveis` (24, 48, 72, 96 e 120 horas sem dormir). "Aparece em" sai de uma
  busca nos catálogos; a busca de Doente é só em maiúsculas, porque "plantas
  doentes" aparece numa habilidade. Em ira e Enfeitiçado saem com **Controle
  seus demônios**, que antes não era usada por nada.
- **Dicionários com número na prosa**: as seções "Mecânica de Ira" (guerreiro)
  e "Contratos de vida" (criatura do mar) explicam as mecânicas de classe e
  **repetem na mão** o teto da barra (10 + 3 por ponto), a faixa de custo da ira
  (4 a 20) e os preços dos contratos (5, 10, 15, 20 e o permanente). São a
  exceção à regra de ler do dado: prosa não sai de `PODERES_POR_NIVEL` sem
  mover constante de lugar. Mexeu nesses números no código, mexa no dicionário
  junto.
- **Dicionários** (`DICIONARIOS`): cada seção tem `titulo` e `paragrafos`, e
  pode ter `subsecoes` ([{ titulo, paragrafos }]) quando o texto pede um bloco
  por assunto. Hoje só "Religião e Fé", no dicionário geral, usa: um bloco por
  deus.
- Personagem tem **foto** e **foto da marca** (a marca é quadrada, o retrato é
  redondo).
- Todo peso de catálogo já foi somado em 1 (não existe mais "sem peso").

---

## Banco de dados

**Hoje a produção é o Neon** (projeto `terarpeqa`, região `us-west-2`, a mesma
costa do serviço do Render). Migrado em 01/10/2026 justamente por causa do que
está logo abaixo. O plano grátis do Neon **não expira**: ele desliga a
computação depois de 5 minutos parado e acorda sozinho na consulta seguinte, e
a documentação é explícita em dizer que estourar limite suspende, mas não apaga
dado. São 0,5 GB de armazenamento — o banco inteiro da mesa tem 16 KB.

A conexão **verifica o certificado TLS** (`rejectUnauthorized: true`), o que só
ficou possível com o Neon: o Render assinava o próprio certificado. Se um dia o
banco for um servidor com certificado próprio, `DATABASE_SSL_INSECURE=1` no
painel desliga a verificação sem precisar de deploy. Conferido com uma
autoridade falsa: com ela o driver recusa a conexão, sem ela conecta.

A migração foi backup → restaurar no Neon → trocar o `DATABASE_URL` no painel do
Render, com os scripts que já existiam. O histórico de rolagens não vai no
backup (só contas e `kv`), e estava vazio nos dois lados na hora da troca.

### O que deu errado antes

**O Postgres gratuito do Render expira.** Aconteceu em 10/09/2026 com o banco
criado em 20/08/2026 — antes dos 30 dias que eu havia estimado — e levou as
contas e fichas junto, porque o backup nunca chegou a rodar. O usuário optou por
recomeçar do zero.

**Nunca estimar o prazo.** A data real está na página do banco no painel do
Render. Eu errei ao dar uma data de cabeça e ele confiou.

**Sintoma de banco expirado:** o site abre, mas o login devolve 503 e
`/api/health` mostra `"db":"iniciando"`. A página do banco no Render mostra
*Free database expired*. Isso vem da retentativa de schema que o servidor faz de
propósito — ele sobe mesmo sem banco, em vez de morrer.

### Backup

`scripts/backup.mjs` e `scripts/restore.mjs`, já testados de ponta a ponta
(backup → restaurar em banco vazio → logar com a senha antiga). Usam o driver do
próprio servidor; não precisa de `pg_dump`.

```powershell
$env:DATABASE_URL="External-Database-URL-do-painel"
node scripts/backup.mjs
```

Não carregam o `.env` de propósito: ele aponta para o banco local, e carregá-lo
faria o usuário achar que salvou a produção tendo salvo um banco vazio.
`backups/` está no `.gitignore` (o arquivo tem hash de senha e todas as fichas).

A URL a usar nos dois scripts é a connection string do Neon, do painel do Neon.
Ela é uma senha: não colar em lugar que vire histórico público.

O catálogo do jogo — feitiços, habilidades, armas, dicionários — vive **no
código**, não no banco. Perder o banco não afeta nada disso.

---

## Armadilhas já encontradas

- **Texto com número fixo desatualiza.** Já aconteceu duas vezes: cards de
  subdivisão diziam "+5 nos testes" depois que os graus viraram +2/+4/+6.
  Preferir ler do dado (`TIERS[1].bonus`) a escrever o número na mão.
- **`peso: <número>`** aparece só nos catálogos; `peso: data.peso` é código.
- Substituições em massa: usar script Node com **contagem esperada** e abortar
  se não bater, em vez de `sed`. Aspas e acentos quebram heredoc no Bash — pôr
  o script num arquivo no scratchpad.
- O `--watch` do Node vigiava o `.pgdata` e corrompia o banco ao reiniciar; por
  isso `dev:api` **não** usa `--watch`.
- **`pkill` não derruba o Node nesta máquina** (Git Bash no Windows). A API velha
  continua na porta 3001, a nova não sobe, e o teste roda contra o banco antigo
  sem avisar — o sinal é o cadastro dizer que o nome já existe logo depois de
  apagar o `.pgdata`. Para encerrar: `netstat -ano | grep LISTENING` para achar
  o PID nas portas 3001 e 517x, conferir com `tasklist` que é `node.exe`, e
  `taskkill //PID <pid> //F`. Matar a API no meio de uma gravação corrompe o
  `.pgdata`; por isso ele é apagado antes de cada subida.
- Botão de rolagem troca o texto para mostrar o resultado: em teste automatizado
  selecionar pelo `title`, não pelo texto.

---

## Pendente

- **Textos das evoluções dos feitiços** que ainda não evoluem — o usuário disse
  que manda depois.
- **Animal místico não trava**: o jogador pode trocar o animal escolhido. Pela
  lore o laço é para a vida toda; se a mestra quiser, dá para deixar a troca só
  com ela.
- **Linha de resistência nas habilidades**: só 8 das 79 estão preenchidas (as
  que já diziam no texto que o alvo resiste). O mecanismo está pronto, falta a
  lista dele.
- **Habilidade cara nova sobe a sanidade** de quem a recebe, porque a reserva é
  a média das 3 mais caras. Habilidade barata não mexe em nada.
- **Fichas antigas acima do orçamento** de atributos depois da mudança para base
  0. Ofereci escrever um script que lista quais precisam de revisão.
- Dicionários das outras classes podem ser reescritos como o do guerreiro foi.

---

## Decisões que o usuário tomou (não reabrir sem motivo)

- Teste de perícia é **1d20 + atributo + bônus**, e não "N dados pelo atributo".
- Custo de vaga do feitiço é pela **evolução** escolhida.
- Nível de classe e nível mágico **coexistem**.
- Dano crítico é o **dano máximo** dos dados, não o dobro do total (mudou em
  12/09/2026; antes era × 2).
- No Bloqueio, só a **Resistência** dobra; equipamento e outros entram cheios.
- Banco: recomeçar de graça em vez de pagar para resgatar os dados perdidos.
- A **aba de Mecânicas** existiu em 26/09/2026 e foi removida a pedido em
  29/09/2026. As regras continuam no CLAUDE.md e nos dois PDFs de análise, na
  área de trabalho do usuário.
- O crítico continua valendo para o **golpe seguinte**, não para o que acertou.
  A análise de 26/09/2026 ofereceu trocar e a decisão foi manter.
- A análise dos feitiços de 29/09/2026 foi aplicada inteira: escala por nível
  mágico, Fome de Karzaron (a I devolvia 13 de mana custando 10 — agora devolve
  um quarto do dano, e a III subiu de 6 para 12 de mana), Herdeiro de chamas
  (II por 6, III em 3d12), Frênesi III (30 de mana fixos viraram metade do nível
  mágico), Pulso Arcano II (mantém o IMÓVEL) e dois feitiços de dano no topo,
  **Capítulo Final** (85) e **Tinta Viva** (95), que eu escrevi — o texto deles é
  meu, não do usuário, e pode ser reescrito à vontade.
- Em 26/09/2026 o usuário mandou aplicar **todas** as sugestões daquela análise:
  dano com atributo, Motoras×1, atributo valendo 8, vagas de habilidade, nível
  mínimo nos animais místicos, régua de bônus, DT de ritual nova, sanidade zero,
  Bloqueio e Esquiva definidos, reserva pelas 3 mais caras.
