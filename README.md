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

Você precisa de um Postgres acessível. Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Gere o segredo da sessão:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Instale e suba os dois processos (em terminais separados):

```bash
npm install
```

```bash
npm run dev:api
```

```bash
npm run dev
```

O front fica em `http://localhost:5173` e repassa `/api` para a porta 3001.

Para rodar igual à produção, num processo só:

```bash
npm run build && npm start
```

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

Antes do prazo acabar, faça backup ou migre para um plano pago:

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

