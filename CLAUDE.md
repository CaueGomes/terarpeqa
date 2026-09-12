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

- **Front**: React + Vite, num arquivo só: `src/App.jsx` (~4.400 linhas).
  Estilo inline + Tailwind. Sem router: a navegação é estado (`screen`).
- **API**: Express em `server/index.js`, Postgres em `server/db.js`.
  Um único serviço serve a API e os arquivos estáticos de `dist/`.
- **Banco**: `DATABASE_URL` aceita dois formatos.
  - `pglite:./.pgdata` → Postgres dentro do próprio processo (desenvolvimento).
  - `postgres://...` → Postgres de verdade (produção, Render).
- **Deploy**: Render, descrito em `render.yaml` (Blueprint). Plano gratuito.
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
Pontos: **4 no nível 1**, mais 1 nos níveis **3, 5, 7 e 9**, mais 2 no **10**
(total 10). Tabela `GANHO_ATRIBUTO_POR_NIVEL`.

### Níveis
Todas as classes têm nível **1 a 10** (`char.nivel`). O mago tem, além disso, o
**nível mágico 5 a 100** (`char.subdivisaoNivel`), que governa feitiços e mana.

### Perícias
23 perícias, graus **Destreinado 0 · Treinado +2 · Veterano +4 · Expert +6**.
Orçamento: `4 + 2 × (nível − 1)` degraus. Perícia dada pela classe já vem no
Treinado e não custa degrau.

**Teste = 1d20 + atributo + bônus da perícia** (treino + outros).
O bônus da perícia em si **não** inclui o atributo, porque é ele que define o
Bloqueio — mexer nisso quebra o Bloqueio.

Perícias dadas pela classe: druida → Ágape; mago → Savoir-faire e Dicionário
mental. Os `id` das perícias nunca mudam (são a chave do treino nas fichas
salvas); renomear é só trocar o `nome`. Ex.: "Percepção" ainda tem id `logica`,
"Guerra" ainda tem id `limiar_dor`.

### Vida, sanidade e mana
```
vida     = classe.vidaBase + vidaPorNivel × (nível−1) + subdivisão + Físico×12 + ganho do nível mágico + bônus de lore
sanidade = classe.sanBase + reserva de habilidades + sanPorNivel × (nível−1) + subdivisão + Psique×12 + ganho do nível mágico + bônus de lore
mana     = nível mágico + 2 × nível de classe   (só mago)
```
Vida, sanidade e **Defesa base** saem do mesmo orçamento: **60 pontos por
classe**, contando 1 por vida, 1 por sanidade e **2 por ponto de Defesa acima
de 8**. Guerreiro 36/14/13, pirata 32/20/12, sereia 30/24/11, druida 30/26/10,
nascido de ouro 26/28/11, mago 22/36/9. Cada subdivisão distribui mais 6 pontos
na mesma moeda (ensanguentado, por exemplo, compra 2 de Defesa). Por nível,
vida + sanidade continuam somando 9. `balancoConferido()` fecha essa conta e
avisa no console em desenvolvimento se alguma linha sair do orçamento.

A **reserva de habilidades** é a parte da sanidade que vem do que as
habilidades custam: a mediana do custo das habilidades daquela classe +
subdivisão, vezes 2 (duas ativações típicas por cena). Ela é **lida do texto
das habilidades** por `custoSanidadeDaHabilidade` — quem escrever "Gasta 12 de
sanidade" numa habilidade nova já muda a conta sozinho. O regex exige a palavra
"gasta" antes do número, senão "recupera 3d10 de sanidade" viraria custo.

Consequência a conhecer: druida místico e dono da coroa passam o mago em
sanidade total, porque as habilidades deles são as mais caras da mesa. O mago
lidera a parte da classe (36), não a reserva (12, ele gasta mana).

### Defesas
```
Defesa   = (base da classe + subdivisão + Motoras×2 + equipamento + outros) × 0,75, arredondado
Bloqueio = bônus de Resistência × 2 + equipamento + outros
Esquiva  = 10 + Motoras + treino de Velocidade de reação + equipamento + outros
```
Motoras conta dobrado **só na Defesa**, que é o único dos três valores sem uma
perícia para crescer junto. Ficha sem classe (deus, inimigo) usa a base 10 do
`BALANCO_PADRAO`.

### Feitiços
23 feitiços, 14 com **evoluções I, II e III**; os outros mostram "Esse feitiço
não tem evoluções disponíveis". A evolução escolhida é o custo em vagas
(I=1, II=2, III=3). Vagas: `2 + ⌊nível mágico ÷ 10⌋`.
Todo feitiço é lançado com **Dicionário mental**. Mana só é gasta em rituais.
`char.feiticos` guarda `{ id, evolucao }`; ficha antiga guarda só a string do id
e é lida como evolução I.

### Rolagem de dados
**Os dados rolam no servidor** (`POST /api/rolls`), nunca no navegador: numa
mesa em que a mestra vê o histórico de todos, um total vindo do cliente seria
só uma sugestão. Botões ao lado de cada perícia, arma, habilidade e feitiço.
Armas têm dois botões: teste e dano.

**Crítico** (só armas): dado bruto do ataque ≥ **18**, sem atributo nem bônus,
faz o golpe seguinte sair no **dano máximo** — cada dado no valor mais alto, sem
rolar (3d10 crítico = 30, mais o modificador). Quem monta esse valor é o
servidor; o cliente só avisa que o golpe está crítico. A marca se apaga depois
do dano.

### Fichas da mestra
`tipoFicha` ∈ `deus`, `inimigo`, `especial`. Sem fórmula: vida, sanidade e mana
nascem em 0 e são digitadas; atributos sem teto; as 23 perícias livres; nenhum
catálogo pré-carregado. Deus funde habilidades e feitiços em "Poderes Divinos".
Especial escolhe uma classe; deus e inimigo não têm classe.

### Conteúdo criado na ficha
Armas, armaduras e habilidades criadas de dentro de uma ficha ficam **nela**
(`char.custom`), não em lugar compartilhado. Feitiço é a exceção: continua vindo
do catálogo da mestra.

### Outros
- Druida tem aba **Animal** com ficha própria do animal-laço, tudo em branco.
- Personagem tem **foto** e **foto da marca** (a marca é quadrada, o retrato é
  redondo).
- Todo peso de catálogo já foi somado em 1 (não existe mais "sem peso").

---

## Banco de dados: o que já deu errado

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

O catálogo do jogo — feitiços, habilidades, armas, dicionários — vive **no
código**, não no banco. Expiração de banco não afeta nada disso.

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
- Botão de rolagem troca o texto para mostrar o resultado: em teste automatizado
  selecionar pelo `title`, não pelo texto.

---

## Pendente

- **Textos das evoluções dos feitiços** que ainda não evoluem — o usuário disse
  que manda depois.
- **Linha de resistência nas habilidades**: só 5 das 53 estão preenchidas (as
  que já diziam no texto que o alvo resiste). O mecanismo está pronto, falta a
  lista dele.
- **Frênesi, evolução 3** diz "troca 30 de mana por miseráveis 8 de mana" —
  provavelmente deveria ser sanidade. Mantido literal, aguardando confirmação.
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
