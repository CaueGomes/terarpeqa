# Terarpeqá

Fichas de personagem, classes e grimório. React + Vite no front, Express + Postgres na API.

## Como funciona

Um único serviço serve as duas coisas: o Express expõe `/api/*` e entrega os
arquivos estáticos de `dist/` para todo o resto.

- **Contas** ficam na tabela `accounts`, com senha em hash (bcrypt).
  A **primeira conta criada vira a mestra** — crie a sua antes de divulgar o link.
- **Fichas e conteúdos** ficam numa tabela chave/valor (`kv`):
  - `char:<dono>:<id>` — o dono e a mestra leem e escrevem; mais ninguém.
  - `content:<tipo>:<id>` — todo mundo lê, só a mestra escreve.
- **Sessão** é um cookie `httpOnly` assinado com `SESSION_SECRET`, válido por 30 dias.

As permissões são aplicadas no servidor, não no navegador.

## Rodando localmente

Não precisa instalar Postgres. Com `DATABASE_URL=pglite:./.pgdata` (o padrão do
`.env.example`), o banco sobe dentro do próprio processo da API e grava em
`.pgdata/`. Para zerar tudo, apague essa pasta.

```bash
npm install
```

```bash
cp .env.example .env
```

Suba os dois processos, em terminais separados:

```bash
npm run dev:api
```

```bash
npm run dev
```

O front fica em `http://localhost:5173` e repassa `/api` para a porta 3001.
Lembre que **a primeira conta criada vira a mestra**, inclusive localmente.

Para rodar igual à produção, num processo só:

```bash
npm run build && npm start
```

## Depurando no VS Code

O `.vscode/launch.json` já vem pronto. Abra a aba **Run and Debug** (`Ctrl+Shift+D`)
e escolha:

- **API (servidor)** — sobe o Express com o banco junto. Breakpoints nas rotas
  e nas consultas funcionam direto.
- **Front (navegador)** — inicia o Vite e abre o Chrome anexado. Breakpoints em
  `src/App.jsx` param no código-fonte, via sourcemap.
- **Tudo (API + front)** — as duas coisas de uma vez.

A API não reinicia sozinha ao salvar: use o botão de restart do depurador
(`Ctrl+Shift+F5`). O front tem hot reload normal do Vite.

## Deploy no Render

O `render.yaml` já descreve o web service e o banco. Ver as instruções completas
no passo a passo do projeto. Variáveis necessárias:

| Variável | Para quê |
| --- | --- |
| `DATABASE_URL` | Conexão do Postgres (use a *Internal Database URL* no Render) |
| `SESSION_SECRET` | Assina o cookie de sessão |
| `NODE_ENV` | `production` — liga o cookie `secure` |

O schema é criado sozinho no primeiro start.

### Atenção ao plano free

O `render.yaml` usa o plano gratuito nos dois serviços. Duas consequências:

- O serviço **hiberna após 15 minutos** sem acesso. O primeiro acesso depois
  disso demora cerca de 1 minuto para responder.
- O **Postgres gratuito é apagado pelo Render após 30 dias**. Quando isso
  acontecer, as contas e fichas vão junto.

Antes do prazo acabar, faça backup ou migre para um plano pago.

## Backup e restauração

Não precisa de `pg_dump` nem de nada instalado: os scripts usam o mesmo driver
do servidor e gravam um JSON com as contas (senha em hash) e todas as fichas.

Pegue a **External Database URL** no painel do Render, na página do banco. A
*Internal* só funciona de dentro da rede do Render e não serve aqui.

No PowerShell:

```powershell
$env:DATABASE_URL="postgresql://...external..."; npm run backup
```

No Bash:

```bash
DATABASE_URL="postgresql://...external..." npm run backup
```

O arquivo cai em `backups/`, com data e hora no nome. O script imprime para qual
banco se conectou e quantas contas e fichas salvou — confira esses números antes
de considerar o backup feito.

Para restaurar em um banco novo, aponte a URL para ele e passe o arquivo:

```powershell
$env:DATABASE_URL="postgresql://...novo..."; npm run restore -- backups/terarpeqa-....json
```

A restauração cria as tabelas se não existirem e sobrescreve o que colidir,
preservando o que só existir no destino. Ou seja, restaurar nunca apaga nada por
conta própria.

Dois cuidados:

- **`backups/` está no `.gitignore`.** O arquivo tem hash de senha e todas as
  fichas; nunca versione nem mande por canal aberto.
- Os scripts **não** carregam o `.env` de propósito. Se carregassem, apontariam
  para o banco local e você acharia que salvou a produção tendo salvo um banco
  vazio. A URL sempre vem explícita na linha de comando.

