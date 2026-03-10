# Sistema de Finanças Pessoais

Aplicação web completa para gerenciamento financeiro pessoal, com dashboard analítico, cadastros auxiliares e gestão de transações.

## Visão Geral

O projeto está dividido em duas aplicações:

- `backend`: API REST em Node.js/Express com TypeScript e MySQL
- `frontend`: interface em Next.js (App Router) com TypeScript e Tailwind CSS

## Funcionalidades

- Dashboard executivo com indicadores financeiros
- Gráfico comparativo `Pago vs Provisão` com labels de valores
- Gráfico unificado de `Evolução no Tempo + Saldo` (3 linhas)
- Filtro global do dashboard por período (`3/6/12 meses`), mês específico e ano
- CRUD de Bancos
- CRUD de Categorias
- CRUD de Descrições
- CRUD de Transações
- Rotina para copiar transações de um mês para múltiplos meses (com ajuste automático de vencimento)
- Rotina para excluir transações por um mês ou seleção de meses
- Filtros por mês, tipo, situação, banco, categoria e busca textual
- Ordenação em tabelas e paginação padronizada
- Resumo consolidado de transações via endpoint dedicado (`/api/transacoes/summary`)

## Tecnologias

### Backend

- Node.js
- Express
- TypeScript
- MySQL2
- Zod
- Swagger (OpenAPI)

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts
- Axios
- lucide-react

## Estrutura do Projeto

```text
financas/
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middlewares/
│  │  ├─ models/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ schemas/
│  │  ├─ services/
│  │  ├─ utils/
│  │  └─ server.ts
│  └─ .env.example
├─ frontend/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     ├─ services/
│     └─ types/
├─ database.sql
└─ README.md
```

## Pré-requisitos

- Node.js 18+
- npm 9+
- MySQL 8+

## Configuração Local

### 1. Banco de dados

Crie o banco no MySQL:

```sql
CREATE DATABASE financas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o arquivo de ambiente com base no exemplo:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Ajuste o arquivo `.env` conforme seu MySQL:

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=financas_db
```

Inicie o backend:

```bash
npm run dev
```

API disponível em `http://localhost:3001`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Se quiser definir a URL da API explicitamente:

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Frontend disponível em `http://localhost:3000`.

## Execução com Docker

O projeto possui containerização individual (`frontend` e `backend`) e orquestração via Docker Compose, com volume persistente para MySQL.

### Serviços

- `db` (MySQL 8)
- `backend` (Node.js/Express)
- `frontend` (Next.js)

### Subir ambiente completo

Na raiz do projeto:

```bash
docker compose up -d --build
```

### Endpoints após subir os containers

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api-docs`
- Health: `http://localhost:3001/health`

### Banco de dados (host)

Para evitar conflito com MySQL local, o container publica:

- Host: `localhost`
- Porta: `3307`
- Banco: `financas_db`
- Usuário: `root`
- Senha: `root`

Os dados do banco ficam persistidos no volume Docker `mysql_data`.

### Parar ambiente

```bash
docker compose down
```

Para remover também o volume de dados:

```bash
docker compose down -v
```

## Documentação da API

Com backend em execução:

- Swagger UI: `http://localhost:3001/api-docs`
- Health check: `http://localhost:3001/health`
- Raiz da API: `http://localhost:3001/`

## Scripts

### Backend (`backend/`)

- `npm run dev`: inicia em desenvolvimento
- `npm run build`: compila TypeScript
- `npm start`: executa build de produção

### Frontend (`frontend/`)

- `npm run dev`: inicia em desenvolvimento
- `npm run build`: build de produção
- `npm start`: executa build de produção
- `npm run lint`: análise estática

## Licença

Este projeto está licenciado sob a licença MIT.
Consulte o arquivo `LICENSE` para mais detalhes.

## Governança do Repositório

- Diretrizes de contribuição: `CONTRIBUTING.md`
- Política de segurança: `SECURITY.md`
- Código de conduta: `CODE_OF_CONDUCT.md`
- Template de Pull Request: `.github/pull_request_template.md`
- Templates de Issues: `.github/ISSUE_TEMPLATE/`
